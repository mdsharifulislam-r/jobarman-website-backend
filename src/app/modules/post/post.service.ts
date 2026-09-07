import { JwtPayload } from 'jsonwebtoken';
import ApiError from '../../../errors/ApiError';
import unlinkFile from '../../../shared/unlinkFile';
import { IPost, PostModel } from './post.interface';
import { Post } from './post.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import { redisClient } from '../../../config/redis';
import { USER_ROLES } from '../../../enums/user';
import { Application } from '../application/application.model';
import { APPLICATION_STATUS } from '../../../enums/application';
import { User } from '../user/user.model';
import { PostHelper } from './post.helper';
import { Favourite } from '../favourite/favourite.model';
import { StatusCodes } from 'http-status-codes';
import stripe from '../../../config/stripe';
import { jobspikrHelper } from '../../../helpers/jobspkrHelper';
import { sendNotifications } from '../../../helpers/notificationsHelper';
import { IQuery } from '../../../helpers/thirdPartyQueryBuilder';
import { mapHelper } from '../../../helpers/mapHelper';
import { Category } from '../category/category.model';
import { AIHelper, UsersInfoResponse } from '../../../helpers/aiHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import { emailHelper } from '../../../helpers/emailHelper';
import { Subscription } from '../subscription/subscription.model';
import { subscriptionHelper } from '../subscription/subscription.helper';
import { ResumeExtractedData } from '../resume/resume.model';

const createPostIntoDB = async (post: IPost): Promise<IPost> => {
  const result = await Post.create(post);
  await RedisHelper.keyDelete('post_feed:*');
 sendNotifications({
    title:`Your post has been created`,
    message:`Your post has been created successfully`,
    filePath:"post",
    referenceId:result._id as any,
    isRead:false,
    receiver:[post?.recruiter!]
  })
  return result;
};

const updatePostToDB = async (
  id: string,
  payload: Partial<IPost>
): Promise<IPost | null> => {
  const exist = await Post.findById(id);
  if (!exist) {
    throw new ApiError(404, 'Post not found');
  }
  if (payload.thumbnail && exist.thumbnail) {
    unlinkFile(exist.thumbnail);
  }
  const result = await Post.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });
  await RedisHelper.keyDelete('post_feed:*');

  return result;
};

const deletePostFromDB = async (id: string): Promise<IPost | null> => {
  const exist = await Post.findById(id);
  if (!exist) {
    throw new ApiError(404, 'Post not found');
  }
  if (exist.thumbnail) {
    unlinkFile(exist.thumbnail);
  }
  const result = await Post.findOneAndUpdate(
    { _id: id },
    { is_deleted: true },
    { new: true }
  );
  await RedisHelper.keyDelete('post_feed:*');
  return result;
};

const postFeedFromDb = async (query: Record<string, any>, user: JwtPayload) => {
  const cache = await RedisHelper.redisGet(`post_feed:${user?.id}`, query);
  if (cache) {
    console.log('from cache');

    return cache;
  }
  const userResumeExtractData = await ResumeExtractedData.findOne({user:user?.id}).sort({createdAt:-1}).lean()
  console.log("userResumeExtractData",userResumeExtractData)
  const limit = Number(query.limit) || 10;
  const initalQuery = {
    is_deleted: false,
    status: { $ne: 'closed' },
  } as Record<string, any>;

  let elasticQuery = {} as IQuery
  if (query.minPrice) {
    if(query.minPrice == 1){
      query.minPrice = 0
    }
    initalQuery.min_salary = { $gte: query.minPrice };
    elasticQuery.minSalary = query.minPrice
  }

  if(query.location){
    initalQuery.location = { $regex: query.location, $options: 'i' };
    const address = await mapHelper.getCountryName(query.location);
    if(address?.country){
      elasticQuery.location = [address.country]
    }
    if(address?.state){
      elasticQuery.state = [address.state]
    }
  }

  if(query.tags){
    const array = query.tags.split(',');
    initalQuery.required_skills = { $in: array };
    elasticQuery.skill = array
  }else{
    if(userResumeExtractData?.skills?.length){
      initalQuery.required_skills = { $in: userResumeExtractData.skills };
      elasticQuery.skill = userResumeExtractData.skills
    }
  }

  if(query.dateLimit){
    const date = PostHelper.getStartDateFromFilter(query.dateLimit);
    
    initalQuery.createdAt = { $gte: date };
  }

  if (query.maxPrice) {
    initalQuery.max_salary = { $lte: query.maxPrice };
    elasticQuery.maxSalary = query.maxPrice
  }

  if (query.startDate) {
    initalQuery.createdAt = { $gte: query.startDate };
    elasticQuery.postDate = new Date(query.startDate).toISOString().split('T')[0];
  }

  if (query.category) {
   
    const array = query.category.split(',');

     const getAllCategories = await Category.find({_id:{$in:array}})
     elasticQuery.jobtitles = getAllCategories?.map((cat: any) => cat.name);
     initalQuery.$or= [
      {category:{$in:array}},
      {category_string:{$in:getAllCategories?.map((cat: any) => cat.name)}}
     ]

  }

  if (query.job_type) {
    const array = query.job_type.split(',');
    initalQuery.job_type = { $in: array };
    
  }

  if (query.job_level) {
    const array = query.job_level.split(',');
    initalQuery.job_level = { $in: array };
    elasticQuery.jobTypes = array
  }else{
    if(userResumeExtractData?.job_level){
      initalQuery.job_level = { $in: [userResumeExtractData.job_level] };
      elasticQuery.jobTypes = [userResumeExtractData.job_level]
    }
  }

  if (query.experience_level) {
    const array = query.experience_level.split(',');
    initalQuery.experience_level = { $in: array };
    if(elasticQuery.jobTypes?.length){
      elasticQuery.jobTypes = [...elasticQuery.jobTypes,...array]
    }else{
      elasticQuery.jobTypes = array
    }
  }

  if(query.radius){
    if(!query.lat || !query.lng){
      throw new ApiError(StatusCodes.BAD_REQUEST,'Please provide lat and lng');
    }
    const {data,pagination} = await PostHelper.getDataByRange(user,initalQuery,query);

    await RedisHelper.redisSet(`post_feed:${user?.id}`, {data,pagination}, query);
    return {data,pagination};
  }

  if(!query?.searchTerm){
    if(userResumeExtractData?.designation){
      initalQuery.searchTerm = userResumeExtractData.designation
    }
  }


  const postQuery = new QueryBuilder(Post.find(initalQuery), query)
    .paginate()
    .sort()
    .filter([
      'minPrice',
      'maxPrice',
      'is_deleted',
      'status',
      'createdAt',
      'category',
      'job_type',
      'job_level',
      'experience_level',
      'dateLimit',
      'tags',
      'location',
    ])
    .search(['title', 'location']);
  const [posts, pagination] = await Promise.all([
    postQuery.modelQuery.populate([
      {
        path: 'recruiter',
        select: 'name image email',
      },
      {
        path: 'category',
        select: 'name',
      }
    ]).exec(),
    postQuery.getPaginationInfo(),
  ]);

  // console.log(posts);
  


  const data = {
    data: await Promise.all(
      posts.map(async (post) => {
        const applications = await Application.findOne({
          post: post._id,
          user: user?.id,
        });

        const isFavorite = await Favourite.findOne({
            post: post._id,
            user: user?.id
        });

        return {
          ...post.toObject(),
          is_applied: applications ? true : false,
          is_favorite: isFavorite ? true : false
        };


    })
    ),
    pagination,
  };

  if(query?.searchTerm){
    if(elasticQuery?.jobtitles?.length){
      elasticQuery.jobtitles = [...elasticQuery.jobtitles,query.searchTerm]
    }
  }else{
      if(userResumeExtractData?.assumptions_designations?.length){
        elasticQuery.jobtitles = [...userResumeExtractData.assumptions_designations]
      }
    }

  // third party posts 

  const thirdPosts = await PostHelper.fullfillDataUsingTheThirdPartyApis(data.data.length,user?.id,limit,elasticQuery,Number(query?.cursor),query?.category?.split(',')[0]);

  data.data = [...data.data,...(thirdPosts?.data||[])];

  if(thirdPosts?.cursor){
    data.pagination.cursor = thirdPosts?.cursor;
  }

  await RedisHelper.redisSet(`post_feed:${user?.id}`, data, query);
  return data;
};

const getPostsFromDB = async (query: Record<string, any>, user: JwtPayload) => {
  const initalQuery = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(
    user.role
  )
    ? { is_deleted: false }
    : { is_deleted: false, recruiter: user.id };
  const postQuery = new QueryBuilder(Post.find(initalQuery), query)
    .paginate()
    .sort()
    .filter(['is_deleted','downloadType',"shortForm"])
    .search(['title']);
  const [posts, pagination] = await Promise.all([
    postQuery.modelQuery.populate('recruiter', 'name email image').exec(),
    postQuery.getPaginationInfo(),
  ]);

  return {
    data:user.role ==USER_ROLES.RECRUITER? query.shortForm=='true'? posts?.map((post) => ({name:post.title,_id:post._id})):await Promise.all(
        posts?.map(async (post) => {
        const applications = await Application.find({
          post: post._id,
        }).populate('user').sort('-createdAt').limit(4);
        
        const userImages = applications?.map((application: any) => {
          return application.user.image;
        });

        const totalapplications = await Application.countDocuments({
          post: post._id,
        })
        
        return {
          ...post.toObject(),
          userImages,
          totalapplications:totalapplications>4?totalapplications-4:totalapplications
        };
      })
    ):posts,
    pagination,
  };
};

const getPostInsigtsFromDB = async (postId: string, days: number = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - days);

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  const applicationsCount = await Application.countDocuments({
    post: postId,
    createdAt: { $gte: date },
  });
  const hiredCount = await Application.countDocuments({
    post: postId,
    status: [APPLICATION_STATUS.SHORTLISTED, APPLICATION_STATUS.INTERVIEW],
    createdAt: { $gte: date },
  });
  const rejectedCount = await Application.countDocuments({
    post: postId,
    status: APPLICATION_STATUS.REJECTED,
    createdAt: { $gte: date },
  });
  const engagedCount = applicationsCount
    ? Math.round(((hiredCount + rejectedCount) / applicationsCount) * 100)
    : 0;
  const recentApplications = await Application.find(
    { post: postId, createdAt: { $gte: date } },
    { post: 1, user: 1, status: 1, jobMatch: 1, createdAt: 1 }
  )
    .populate('user', 'name email image bio designation')
    .sort({ createdAt: -1 })
    .limit(10);
  const recentQualifiedApplications = await Application.find(
    {
      post: postId,
      status: [APPLICATION_STATUS.SHORTLISTED, APPLICATION_STATUS.INTERVIEW],
      createdAt: { $gte: date },
    },
    { post: 1, user: 1, status: 1, jobMatch: 1, createdAt: 1 }
  )
    .populate('user', 'name email image bio designation')
    .sort({ createdAt: -1 })
    .limit(10);

  return {
    summary: {
      total: applicationsCount,
      qualified: hiredCount,
      rejected: rejectedCount,
      engaged: engagedCount,
    },
    recentApplications,
    recentQualifiedApplications,
  };
};

const getRecomendedPostsFromDB = async (user: JwtPayload) => {
  const userDetails = await User.findById(user.id);
  if (!userDetails) {
    throw new ApiError(404, 'User not found');
  }

  if (!userDetails.skills || userDetails.skills.length === 0) {
    const postQuery = new QueryBuilder(
      Post.find({
        is_deleted: false,
        status: 'active',
        deadline: { $gte: new Date() },
      }),
      {}
    )
      .paginate()
      .sort();
    const [posts, pagination] = await Promise.all([
      postQuery.modelQuery.populate([
        {
          path: 'recruiter',
          select: 'name email image',
        },
        {
          path: 'category',
          select: 'name',
        }
      ]).exec(),
      postQuery.getPaginationInfo(),
    ]);

    return {
      data: await Promise.all(
        posts.map(async (post) => {
          const applications = await Application.findOne({
            post: post._id,
            user: user.id,
          });
          const isFavorite = await Favourite.findOne({
            post: post._id,
            user: user.id
          })
          return {
            ...post.toObject(),
            is_applied: applications ? true : false,
            is_favorite: isFavorite ? true : false
          };
        })
      ),
      pagination,
    };
  }

  const postQuery = new QueryBuilder(
    Post.find({
      is_deleted: false,
      status: 'active',
      required_skills: { $in: userDetails.skills },
      deadline: { $gte: new Date() },
    }),
    {}
  )
    .paginate()
    .sort();
  const [posts, pagination] = await Promise.all([
    postQuery.modelQuery.populate([
      {
        path: 'recruiter',
        select: 'name email image',
      },
      {
        path: 'category',
        select: 'name',
      }
    ]).exec(),
    postQuery.getPaginationInfo(),
  ]);

  return {
    data: posts,
    pagination,
  };
};

const recentPostsFromDB = async (query: Record<string, any>) => {
  const cache = await RedisHelper.redisGet(`recent_posts`, query);
  if (cache) {
    console.log('from cache');
    return cache;
  }
  const postQuery = new QueryBuilder(
    Post.find({
      is_deleted: false,
      status: 'active',
      deadline: { $gte: new Date() },
    }),
    query
  )
    .paginate()
    .sort()
    .filter(['is_deleted'])
    .search(['title', 'description']);
  const [posts, pagination] = await Promise.all([
    postQuery.modelQuery
      .populate('recruiter', 'name email image').exec(),
    postQuery.getPaginationInfo(),
  ]);

  const data = {
    data: posts,
    pagination,
  };

  await RedisHelper.redisSet(`recent_posts`, data, query);
  return data;
};

const getSinglePostDetails = async (id: string) => {
  const cache = await RedisHelper.redisGet(`post:${id}`);
  if (cache) {
    console.log('from cache');
    return cache;
  }
  const post = await Post.findById(id)
    .populate([
      { path: 'recruiter', select: 'name email image' },
      { path: 'category', select: 'name' },
    ])
    .lean();
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }
  await RedisHelper.redisSet(`post:${id}`, post);
  const userImages= (await Application.find({post:id}).populate('user').limit(4)).map((application:any) => application.user.image);
  const totalapplications = await Application.countDocuments({post:id});

  return {
    ...post,
    category: (post.category as any)?.name,
    categoryId: (post.category as any)?._id,
    totalapplications,
    userImages
  };

};


const bulkInsertPostIntoDB = async (posts: IPost[]) => {
  const result = await Post.insertMany(posts);
  await RedisHelper.keyDelete('post_feed:*');
  return result;
};


const sendEmailForMathchedPosts = async (userInfo:UsersInfoResponse) => {

  try {
    
  // get system jobs useing the userinfo.jobTypes with posts title filter regex match
const buildRegexArray = (arr: string[]) =>
  arr.map((item) => new RegExp(`^${item}$`, "i"));

const systemMatchedPosts = await Post.find({
  is_deleted: false,
  status: "active",
  deadline: { $gte: new Date() },

  ...(userInfo.jobTypes?.length && {
    title: { $in: buildRegexArray(userInfo.jobTypes) }
  }),
  $or: [
    ...(userInfo.country?.length ? [{ location: { $in: buildRegexArray(userInfo.country) } }] : []),
    ...(userInfo.state?.length ? [{ location: { $in: buildRegexArray(userInfo.state) } }] : []),
  ]
}).lean().limit(20);

  
  
    const userInfoFromDB = await User.findById(userInfo.userId);
  if(!userInfoFromDB){
   return {}
  }

  const subscription = await Subscription.findOne({user:userInfo.userId,status:'active'}).sort({createdAt:-1}).lean()

  console.log('Subscription');
  
  // if(!subscription){
  //   return {}
  // }

  if(systemMatchedPosts.length >= 20){
    // send email to user with matched posts
    console.log("Sending system matched posts email");
    const template = emailTemplate.jobMatchEmailTemplate({
      userName:userInfoFromDB.name!,
      email:userInfoFromDB.email,
      jobs: systemMatchedPosts as any as IPost[],
      isPremiumUser:subscription?.name?.includes('Platinum')||subscription?.name?.includes('Gold')|| subscription?.name?.includes('Premium'),
    })

    await emailHelper.sendEmail(template)
    await User.findByIdAndUpdate(userInfo.userId,{last_job_update:new Date()})
    return
  }
  console.log('sending third matched posts email');
  
  
  const matchedPosts = await jobspikrHelper.getJobs({
    jobtitles:userInfo.jobTypes,
    // location:userInfo.locations,
    // jobTypes:userInfo.jobLevels,
    location:userInfo.country,
    state:userInfo.state,
    limit:20
  })
try {
    await Post.insertMany(matchedPosts.data)
} catch (error) {
  console.log(error);
  
}


  
  // send email to user with matched posts
  const template = emailTemplate.jobMatchEmailTemplate({
    userName:userInfoFromDB.name!,
    email:userInfoFromDB.email,
    jobs: matchedPosts.data as any as IPost[],
    isPremiumUser:await subscriptionHelper.isPremiumUser(userInfo.userId),
  })

  await emailHelper.sendEmail(template)
  await User.findByIdAndUpdate(userInfo.userId,{last_job_update:new Date()})
  } catch (error) {
    console.log(error);
    
  }
}

const getJobMatchPercentances = async (userId: string,postId: string) => {
  const cache = await RedisHelper.redisGet(`job_match_percentage:${userId}:${postId}`);
  if (cache) {
    console.log('from cache');
    return cache;
  }
  const percentage = await AIHelper.getJobMatchPercentances(userId,postId);
  await RedisHelper.redisSet(`job_match_percentage:${userId}:${postId}`, percentage);
  return percentage;
}

export const PostServices = {
  createPostIntoDB,
  updatePostToDB,
  deletePostFromDB,
  postFeedFromDb,
  getPostsFromDB,
  getPostInsigtsFromDB,
  getRecomendedPostsFromDB,
  recentPostsFromDB,
  getSinglePostDetails,
  bulkInsertPostIntoDB,
  sendEmailForMathchedPosts,
  getJobMatchPercentances
};

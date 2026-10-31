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

const getMatchingCategoryIds = (
  post: Partial<IPost>,
  categories: Array<{ _id: { toString(): string }; name: string }>
) => {
  return categories
    .filter(category => {
      const titleMatches =
        typeof post.title === 'string' &&
        new RegExp(
          category.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          'i'
        ).test(post.title);

      return (
        post.category?.toString() === category._id?.toString() ||
        post.category_string === category.name ||
        titleMatches
      );
    })
    .map(category => category._id.toString());
};

const updateCategoryJobCounts = async (
  previousPost: Partial<IPost>,
  nextPost: Partial<IPost>,
  categories: Array<{ _id: { toString(): string }; name: string }>
) => {
  const previous = new Set(getMatchingCategoryIds(previousPost, categories));
  const next = new Set(getMatchingCategoryIds(nextPost, categories));
  const changes = new Map<string, number>();

  for (const id of previous) {
    if (!next.has(id)) changes.set(id, -1);
  }
  for (const id of next) {
    if (!previous.has(id)) changes.set(id, 1);
  }

  await Promise.all(
    [...changes].map(([id, increment]) =>
      Category.updateOne({ _id: id }, { $inc: { _job_count: increment } })
    )
  );
};

const incrementCategoryJobCounts = async (
  posts: IPost[],
  categories: Array<{ _id: { toString(): string }; name: string }>
) => {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const key of getMatchingCategoryIds(post, categories)) {
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }

  if (counts.size) {
    await Category.bulkWrite(
      [...counts].map(([id, count]) => ({
        updateOne: {
          filter: { _id: id },
          update: { $inc: { _job_count: count } },
        },
      }))
    );
  }
};

const createPostIntoDB = async (post: IPost): Promise<IPost> => {
  const categories = await Category.find({}).select('name').lean();
  const result = await Post.create(post);
  await updateCategoryJobCounts({}, post, categories);
  await RedisHelper.keyDelete('post_feed:*');
  await RedisHelper.keyDelete('all_category:*');
  sendNotifications({
    title: `Your post has been created`,
    message: `Your post has been created successfully`,
    filePath: "post",
    referenceId: result._id as any,
    isRead: false,
    receiver: [post?.recruiter!]
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
  const categories = await Category.find({}).select('name').lean();
  const nextPost = { ...exist.toObject(), ...payload };
  const result = await Post.findOneAndUpdate(
    { _id: id },
    payload,
    { new: true }
  );
  await updateCategoryJobCounts(exist, nextPost, categories);
  await RedisHelper.keyDelete('post_feed:*');
  await RedisHelper.keyDelete('all_category:*');

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
  // const cache = await RedisHelper.redisGet(`post_feed:${user?.id}`, query);
  // if (cache) {
  //   console.log('from cache');

  //   return cache;
  // }
  const userResumeExtractData = await ResumeExtractedData.findOne({ user: user?.id }).sort({ createdAt: -1 }).lean()
  // console.log("userResumeExtractData",userResumeExtractData)
  const limit = Number(query.limit) || 10;
  const initalQuery = {
    is_deleted: false,
    status: 'active',
  } as Record<string, any>;

  let elasticQuery = {} as IQuery
  if (query.minPrice) {
    if (query.minPrice == 1) {
      query.minPrice = 0
    }
    initalQuery.min_salary = { $gte: query.minPrice };
    elasticQuery.minSalary = query.minPrice
  }

  if (query.location) {
    const escapedLocation = String(query.location).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    initalQuery.location = { $regex: escapedLocation, $options: 'i' };
    const address = await mapHelper.getCountryName(query.location);
    if (address?.country) {
      elasticQuery.location = [address.country]
    }
    if (address?.state) {
      elasticQuery.state = [address.state]
    }
  }

  if (query.tags) {
    const array = query.tags.split(',');
    initalQuery.required_skills = { $in: array };
    elasticQuery.skill = array
  } else {
    // if(userResumeExtractData?.skills?.length){
    //   initalQuery.required_skills = { $in: userResumeExtractData.skills };
    //   elasticQuery.skill = userResumeExtractData.skills
    // }
  }

  if (query.dateLimit) {
    const date = PostHelper.getStartDateFromFilter(query.dateLimit);

    initalQuery.createdAt = { $gte: date };
    elasticQuery.postDate = date.split('T')[0];
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

    const getAllCategories = await Category.find({ _id: { $in: array } })
    elasticQuery.jobtitles = getAllCategories?.map((cat: any) => cat.name);
    initalQuery.$or = [
      { category: { $in: array } },
      { category_string: { $in: getAllCategories?.map((cat: any) => cat.name) } }
    ]

  }

  if (query.job_type) {
    const array = query.job_type.split(',');
    initalQuery.job_type = { $in: array };
    elasticQuery.jobTypes = array;
  }

  if (query.job_level) {
    const array = query.job_level.split(',');
    initalQuery.job_level = { $in: array };
    elasticQuery.seniority = array;
  }
  // else{
  //   if(userResumeExtractData?.job_level){
  //     initalQuery.job_level = { $in: [userResumeExtractData.job_level] };
  //     elasticQuery.jobTypes = [userResumeExtractData.job_level]
  //   }
  // }

  if (query.experience_level) {
    const array = query.experience_level.split(',');
    initalQuery.experience_level = { $in: array };
  }

  if (!query?.searchTerm && !query?.category) {
    if (userResumeExtractData?.designation) {
      query.searchTerm = userResumeExtractData.designation
    }
  }

  const searchTerm =
    typeof query.searchTerm === 'string' ? query.searchTerm.trim() : '';
  if (searchTerm) {
    query.searchTerm = searchTerm;
    const searchTerms = [...new Set(searchTerm.split(/\s+/).filter(Boolean))];
    const escapedSearchTerms = searchTerms.map(term =>
      term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    const matchingCategories = await Category.find({
      $or: escapedSearchTerms.map(term => ({
        name: { $regex: term, $options: 'i' },
      })),
    })
      .lean();
    const searchableFields = [
      'title',
      'description',
      'location',
      'category_string',
      'recruiter_company',
      'required_skills',
      'job_type',
      'job_level',
      'experience_level',
      'work_mode',
    ];

    initalQuery.$and = searchTerms.map((term, index) => {
      const regex = new RegExp(escapedSearchTerms[index], 'i');
      const conditions: Record<string, any>[] = searchableFields.map(field => ({
        [field]: regex,
      }));
      const matchingCategoryIds = matchingCategories
        .filter(category => regex.test(category.name))
        .map(category => category._id);

      if (matchingCategoryIds.length) {
        conditions.push({ category: { $in: matchingCategoryIds } });
      }

      return { $or: conditions };
    });
  }

  if (searchTerm && searchTerm !== userResumeExtractData?.designation) {
    if (elasticQuery.jobtitles?.length) {
      elasticQuery.jobtitles = [...elasticQuery.jobtitles, searchTerm];
    } else {
      elasticQuery.jobtitles = [searchTerm];
    }
  } else {
    if (userResumeExtractData?.assumptions_designations?.length) {
      elasticQuery.jobtitles = [userResumeExtractData.designation!];
    }
    if (userResumeExtractData?.skills?.length) {
      elasticQuery.skill = userResumeExtractData.skills;
    }
  }

  if (query.radius) {
    const latitude = Number(query.lat);
    const longitude = Number(query.lng);
    const radius = Number(query.radius);
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(radius) ||
      radius <= 0
    ) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Please provide valid lat, lng, and radius'
      );
    }
    const { data, pagination } = await PostHelper.getDataByRange(
      user,
      initalQuery,
      query,
      elasticQuery,
      query?.category?.split(',')[0]
    );

    await RedisHelper.redisSet(`post_feed:${user?.id}`, { data, pagination }, query);
    return { data, pagination };
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
    ]);
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

  if (searchTerm === userResumeExtractData?.designation) {
    delete query.searchTerm
  }


  // if(!query?.searchTerm){
  //   if(userResumeExtractData?.designation){
  //     query.searchTerm = userResumeExtractData.designation
  //   }
  // }


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

  // third party posts 
  const thirdPosts = await PostHelper.fullfillDataUsingTheThirdPartyApis(data.data.length, user?.id, limit, elasticQuery,   query?.cursor ? Number(query.cursor) : undefined, query?.category?.split(',')[0]);
  data.data = [...data.data, ...(thirdPosts?.data || [])];

  if (thirdPosts?.cursor) {
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
    .filter(['is_deleted', 'downloadType', "shortForm"])
    .search(['title']);
  const [posts, pagination] = await Promise.all([
    postQuery.modelQuery.populate('recruiter', 'name email image').exec(),
    postQuery.getPaginationInfo(),
  ]);

  return {
    data: user.role == USER_ROLES.RECRUITER ? query.shortForm == 'true' ? posts?.map((post) => ({ name: post.title, _id: post._id })) : await Promise.all(
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
          totalapplications: totalapplications > 4 ? totalapplications - 4 : totalapplications
        };
      })
    ) : posts,
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

  // ── Graph: daily breakdown ────────────────────────────────────────────────
  // Build a complete list of day labels within the selected range
  const dayLabels: string[] = [];
  const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    // For week view (≤7 days) use short day names; otherwise use "DD MMM"
    const label =
      days <= 7
        ? shortDayNames[d.getDay()]
        : `${String(d.getDate()).padStart(2, '0')} ${monthNames[d.getMonth()]}`;
    dayLabels.push(label);
  }

  // Aggregate daily totals for all applications
  const dailyApplicationsAgg = await Application.aggregate([
    {
      $match: {
        post: post._id,
        createdAt: { $gte: date },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          dayOfWeek: { $dayOfWeek: '$createdAt' }, // 1=Sun … 7=Sat
        },
        total: { $sum: 1 },
        qualified: {
          $sum: {
            $cond: [
              {
                $in: [
                  '$status',
                  [APPLICATION_STATUS.SHORTLISTED, APPLICATION_STATUS.INTERVIEW],
                ],
              },
              1,
              0,
            ],
          },
        },
        rejected: {
          $sum: {
            $cond: [{ $eq: ['$status', APPLICATION_STATUS.REJECTED] }, 1, 0],
          },
        },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  ]);

  // Map aggregated results to their day label
  const aggMap = new Map<string, { total: number; qualified: number; rejected: number }>();
  for (const row of dailyApplicationsAgg) {
    const d = new Date(row._id.year, row._id.month - 1, row._id.day);
    const label =
      days <= 7
        ? shortDayNames[d.getDay()]
        : `${String(d.getDate()).padStart(2, '0')} ${monthNames[d.getMonth()]}`;
    aggMap.set(label, {
      total: row.total,
      qualified: row.qualified,
      rejected: row.rejected,
    });
  }

  // Build the final graph series, filling zeros for days with no data
  const graphData = dayLabels.map((label) => {
    const row = aggMap.get(label) ?? { total: 0, qualified: 0, rejected: 0 };
    const engagement = row.total
      ? Math.round(((row.qualified + row.rejected) / row.total) * 100)
      : 0;
    return {
      label,
      application: row.total,
      qualified: row.qualified,
      rejected: row.rejected,
      engagement,
    };
  });
  // ─────────────────────────────────────────────────────────────────────────

  return {
    summary: {
      total: applicationsCount,
      qualified: hiredCount,
      rejected: rejectedCount,
      engaged: engagedCount,
    },
    recentApplications,
    recentQualifiedApplications,
    graph: graphData,
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
  const userImages = (await Application.find({ post: id }).populate('user').limit(4)).map((application: any) => application.user.image);
  const totalapplications = await Application.countDocuments({ post: id });

  return {
    ...post,
    category: (post.category as any)?.name,
    categoryId: (post.category as any)?._id,
    totalapplications,
    userImages
  };

};


const bulkInsertPostIntoDB = async (
  posts: IPost[],
  options: { ordered?: boolean } = {}
) => {
  const categories = await Category.find({}).select('name').lean();
  let result: IPost[];
  try {
    result = await Post.insertMany(posts, options);
  } catch (error) {
    const insertedPosts =
      error &&
      typeof error === 'object' &&
      'insertedDocs' in error &&
      Array.isArray(error.insertedDocs)
        ? (error.insertedDocs as IPost[])
        : [];
    if (insertedPosts.length) {
      await incrementCategoryJobCounts(insertedPosts, categories);
      await RedisHelper.keyDelete('post_feed:*');
      await RedisHelper.keyDelete('all_category:*');
    }
    throw error;
  }
  await incrementCategoryJobCounts(result, categories);
  await RedisHelper.keyDelete('post_feed:*');
  await RedisHelper.keyDelete('all_category:*');
  return result;
};


const sendEmailForMathchedPosts = async (userInfo: UsersInfoResponse) => {

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
    if (!userInfoFromDB) {
      return {}
    }

    const subscription = await Subscription.findOne({ user: userInfo.userId, status: 'active' }).sort({ createdAt: -1 }).lean()

    console.log('Subscription');

    // if(!subscription){
    //   return {}
    // }

    if (systemMatchedPosts.length >= 20) {
      // send email to user with matched posts
      console.log("Sending system matched posts email");
      const template = emailTemplate.jobMatchEmailTemplate({
        userName: userInfoFromDB.name!,
        email: userInfoFromDB.email,
        jobs: systemMatchedPosts as any as IPost[],
        isPremiumUser: subscription?.name?.includes('Platinum') || subscription?.name?.includes('Gold') || subscription?.name?.includes('Premium'),
      })

      await emailHelper.sendEmail(template)
      await User.findByIdAndUpdate(userInfo.userId, { last_job_update: new Date() })
      return
    }
    console.log('sending third matched posts email');


    const matchedPosts = await jobspikrHelper.getJobs({
      jobtitles: userInfo.jobTypes,
      // location:userInfo.locations,
      // jobTypes:userInfo.jobLevels,
      location: userInfo.country,
      state: userInfo.state,
      limit: 20
    })
    try {
      await bulkInsertPostIntoDB(matchedPosts.data as any as IPost[])
    } catch (error) {
      console.log(error);

    }



    // send email to user with matched posts
    const template = emailTemplate.jobMatchEmailTemplate({
      userName: userInfoFromDB.name!,
      email: userInfoFromDB.email,
      jobs: matchedPosts.data as any as IPost[],
      isPremiumUser: await subscriptionHelper.isPremiumUser(userInfo.userId),
    })

    await emailHelper.sendEmail(template)
    await User.findByIdAndUpdate(userInfo.userId, { last_job_update: new Date() })
  } catch (error) {
    console.log(error);

  }
}

const getJobMatchPercentances = async (userId: string, postId: string) => {
  const cache = await RedisHelper.redisGet(`job_match_percentage:${userId}:${postId}`);
  if (cache) {
    console.log('from cache');
    return cache;
  }
  const percentage = await AIHelper.getJobMatchPercentances(userId, postId);
  await RedisHelper.redisSet(`job_match_percentage:${userId}:${postId}`, percentage);
  return percentage;
}


const getTotalJobCounts = async () => {
  const total = await Post.countDocuments({
    is_deleted: false,
    status: 'active',
  });
  return total;
};

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
  getJobMatchPercentances,
  getTotalJobCounts
};

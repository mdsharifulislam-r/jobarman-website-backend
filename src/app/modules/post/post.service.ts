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

const createPostIntoDB = async (post: IPost): Promise<IPost> => {
    const result = await Post.create(post);
    await RedisHelper.keyDelete('post_feed:*')
    return result;
};

const updatePostToDB = async (id: string, payload: Partial<IPost>): Promise<IPost | null> => {
    const exist = await Post.findById(id);
    if (!exist) {
        throw new ApiError(404,'Post not found');
    }
    if(payload.thumbnail && exist.thumbnail){
        unlinkFile(exist.thumbnail);
    }
    const result = await Post.findOneAndUpdate({ _id: id }, payload, { new: true });
    await RedisHelper.keyDelete('post_feed:*')

    return result;
};

const deletePostFromDB = async (id: string): Promise<IPost | null> => {
    const exist = await Post.findById(id);
    if (!exist) {
        throw new ApiError(404,'Post not found');
    }
    if(exist.thumbnail){
        unlinkFile(exist.thumbnail);
    }
    const result = await Post.findOneAndUpdate({ _id: id }, { is_deleted: true }, { new: true });
    await RedisHelper.keyDelete('post_feed:*')
    return result;
};

const postFeedFromDb = async (query:Record<string,any>,user:JwtPayload) => {
    const cache = await RedisHelper.redisGet(`post_feed`,query)
    if(cache){
        console.log("from cache");
        
        return cache
    }
    const initalQuery = {is_deleted:false,status:{$ne:'closed'}} as Record<string,any>
    if(query.minPrice){
        initalQuery.min_salary = {$gte:query.minPrice}
    }

    if(query.maxPrice){
        initalQuery.max_salary = {$lte:query.maxPrice}
    }

    if(query.startDate){
        initalQuery.createdAt = {$gte:query.startDate}
    }



    const postQuery = new QueryBuilder(Post.find(initalQuery), query).paginate().sort().filter(['minPrice','maxPrice','is_deleted','status']).search(['title','description'])
    const [posts,pagination] = await Promise.all([
      postQuery.modelQuery.exec(),
      postQuery.getPaginationInfo()
    ])
  
    const data = {
      data:posts,
      pagination
    }

    await RedisHelper.redisSet(`post_feed`,data,query)
    return data
}

const getPostsFromDB = async (query:Record<string,any>,user:JwtPayload) => {
    const initalQuery = [USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN].includes(user.role) ? {is_deleted:false} : {is_deleted:false,recruiter:user.id}
    const postQuery = new QueryBuilder(Post.find(initalQuery), query).paginate().sort().filter(['is_deleted']).search(['title','description'])
    const [posts,pagination] = await Promise.all([
      (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN) ? postQuery.modelQuery.exec() : postQuery.modelQuery.populate('recruiter','name email image').exec(),
      postQuery.getPaginationInfo()
    ])
  
    return {
      data:posts,
      pagination
    }
}


const getPostInsigtsFromDB = async (postId:string,days:number=30) => {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const post = await Post.findById(postId);
    if(!post){
        throw new ApiError(404,'Post not found');
    }


    
    
    const applicationsCount = await Application.countDocuments({post:postId,createdAt:{$gte:date}})
    const hiredCount = await Application.countDocuments({post:postId,hiringStatus:'hired',createdAt:{$gte:date}})
    const rejectedCount = await Application.countDocuments({post:postId,status:APPLICATION_STATUS.REJECTED,createdAt:{$gte:date}})
    const engagedCount = applicationsCount? Math.round((hiredCount+rejectedCount)/(applicationsCount)*100):0;
    const recentApplications = await Application.find({post:postId,createdAt:{$gte:date}},{post:1,user:1,status:1,jobMatch:1,createdAt:1}).populate('user','name email image bio designation').sort({createdAt:-1}).limit(10);
    const recentQualifiedApplications = await Application.find({post:postId,status:[APPLICATION_STATUS.SHORTLISTED,APPLICATION_STATUS.INTERVIEW],createdAt:{$gte:date}},{post:1,user:1,status:1,jobMatch:1,createdAt:1}).populate('user','name email image bio designation').sort({createdAt:-1}).limit(10);

    return {
        summary:{
            total: applicationsCount,
            qualified:hiredCount,
            rejected:rejectedCount,
            engaged:engagedCount
        },
        recentApplications,
        recentQualifiedApplications
    }

}



export const PostServices = {
    createPostIntoDB,
    updatePostToDB,
    deletePostFromDB,
    postFeedFromDb,
    getPostsFromDB,
    getPostInsigtsFromDB
};

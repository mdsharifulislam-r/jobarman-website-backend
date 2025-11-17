import { JwtPayload } from 'jsonwebtoken';
import ApiError from '../../../errors/ApiError';
import unlinkFile from '../../../shared/unlinkFile';
import { IPost, PostModel } from './post.interface';
import { Post } from './post.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import { redisClient } from '../../../config/redis';
import { USER_ROLES } from '../../../enums/user';

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



export const PostServices = {
    createPostIntoDB,
    updatePostToDB,
    deletePostFromDB,
    postFeedFromDb,
    getPostsFromDB
};

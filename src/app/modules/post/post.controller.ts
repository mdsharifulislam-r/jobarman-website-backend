import { Request, Response, NextFunction } from 'express';
import { PostServices } from './post.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { IPost } from './post.interface';
import ApiError from '../../../errors/ApiError';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { getSingleFilePath } from '../../../shared/getFilePath';
import { getFromGoogleMaps } from '../../../helpers/mapHelper';

const createPost = catchAsync(async (req: Request, res: Response) => {
    const post:IPost = req.body;
    const image = getSingleFilePath(req.files, 'image');
    const user = (req.user as any);
    post.recruiter = user!.id;
    post.thumbnail = image! || post?.prevImage!;
    post.prevPostId = post?.prevPostId || undefined;
    post.is_repost = post?.prevPostId ? true : false;

    const isValidAddress = await getFromGoogleMaps(post.location);
    if(!isValidAddress){
      throw new ApiError(400, 'Invalid address');
    }

    await kafkaProducer.sendMessage("post", {type:"create",data:post});
    
    
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Post created successfully',
        data: post,
    });
});

const updatePost = catchAsync(async (req: Request, res: Response) => {
    const post = req.body;
    const image = getSingleFilePath(req.files, 'image');
    const id = req.params.id;
    post._id = id;
    post.thumbnail = image!;
    console.log(post);
    
    await kafkaProducer.sendMessage("post", {type:"update",data:post});
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Post updated successfully',
        data: post,
    });
});

const deletePost = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    await kafkaProducer.sendMessage("post", {type:"delete",data:{_id:id}});
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Post deleted successfully',
    });
});

const getPostFeed = catchAsync(async (req: Request, res: Response) => {
    if(!(req.user as any)){
        req.user = {id: '6942a462e161f5b337a97b59'};
    }
    const result = await PostServices.postFeedFromDb(req.query, (req.user as any)!);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Post feed fetched successfully',
        data: result.data,
        pagination: result.pagination
    });
})


const getPosts = catchAsync(async (req: Request, res: Response) => {
    const result = await PostServices.getPostsFromDB(req.query, (req.user as any)!);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Posts fetched successfully',
        data: result.data,
        pagination: result.pagination
    });
})


const getPostInsigts = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await PostServices.getPostInsigtsFromDB(id,Number(req.query.days) || 30);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Post insights fetched successfully',
        data: result,
    });
})


const getRecommendedPosts = catchAsync(async (req: Request, res: Response) => {
    const result = await PostServices.getRecomendedPostsFromDB((req.user as any));
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Recommended posts fetched successfully',
        data: result.data,
        pagination: result.pagination
    });
})


const getRecentsPosts = catchAsync(async (req: Request, res: Response) => {
    const result = await PostServices.recentPostsFromDB(req.query);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Recent posts fetched successfully',
        data: result.data,
        pagination: result.pagination
    });
})


const getPost = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await PostServices.getSinglePostDetails(id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Post fetched successfully',
        data: result,
    });
})

export const PostController = {
    createPost,
    updatePost,
    deletePost,
    getPostFeed,
    getPosts,
    getPostInsigts,
    getRecommendedPosts,
    getRecentsPosts,
    getPost

};

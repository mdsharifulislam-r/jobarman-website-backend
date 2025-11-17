import { Request, Response, NextFunction } from 'express';
import { PostServices } from './post.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { IPost } from './post.interface';
import ApiError from '../../../errors/ApiError';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { getSingleFilePath } from '../../../shared/getFilePath';

const createPost = catchAsync(async (req: Request, res: Response) => {
    const post:IPost = req.body;
    const image = getSingleFilePath(req.files, 'image');
    const user = req.user;
    post.recruiter = user.id;
    post.thumbnail = image!;

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
    const result = await PostServices.postFeedFromDb(req.query, req.user);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Post feed fetched successfully',
        data: result.data,
        pagination: result.pagination
    });
})


const getPosts = catchAsync(async (req: Request, res: Response) => {
    const result = await PostServices.getPostsFromDB(req.query, req.user);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Posts fetched successfully',
        data: result.data,
        pagination: result.pagination
    });
})


export const PostController = {
    createPost,
    updatePost,
    deletePost,
    getPostFeed,
    getPosts

};

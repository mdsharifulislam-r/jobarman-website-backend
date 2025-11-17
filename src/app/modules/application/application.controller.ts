import { Request, Response, NextFunction } from 'express';
import { ApplicationServices } from './application.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { Post } from '../post/post.model';
import ApiError from '../../../errors/ApiError';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { getMultipleFilesPath, getSingleFilePath } from '../../../shared/getFilePath';
import { Application } from './application.model';
import { APPLICATION_STATUS } from '../../../enums/application';
const createApplication = catchAsync(async (req: Request, res: Response) => {
    const { ...applicationData } = req.body;
    const resume = getSingleFilePath(req.files, 'resume');
    const other_documents = getMultipleFilesPath(req.files, 'doc');
    applicationData.user = req.user.id;
    const post = await Post.findById(applicationData.post);
    if (!post) {
        throw new ApiError(404, 'Post not found');
    }

    if(new Date(post.deadline)< new Date() || post.status === 'closed') {
        throw new ApiError(400, 'Post is closed or deadline is over');
    }

    applicationData.recruiter = post.recruiter;
    applicationData.resume = resume!;
    applicationData.other_documents = other_documents!;
    await kafkaProducer.sendMessage("application", {type:"create",data:applicationData});
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Application created successfully',
        data: applicationData
    });
})


const getApplications = catchAsync(async (req: Request, res: Response) => {
    const result = await ApplicationServices.getAllApplications(req.query, req.user);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Applications fetched successfully',
        data: result.data,
        pagination: result.pagination
    });
})


const updateStatusOfApplications = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const body= req.body;
    const application = await Application.findById(id);
        if(!application){
        throw new ApiError(404, 'Application not found');
    }
    if (application.status === body.status) {
        throw new ApiError(400, 'Application already in this status');
    }

    if([APPLICATION_STATUS.REJECTED,APPLICATION_STATUS.INTERVIEW].includes(application.status)){
        throw new ApiError(403, 'You can not update this application');
    }
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Application status updated successfully',
        data: body
    });
})


export const ApplicationController = {
    createApplication,
    getApplications
};

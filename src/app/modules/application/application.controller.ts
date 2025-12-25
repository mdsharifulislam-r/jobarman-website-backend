import { Request, Response, NextFunction } from 'express';
import { ApplicationServices } from './application.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { Post } from '../post/post.model';
import ApiError from '../../../errors/ApiError';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { getMultipleFilesPath, getSingleFilePath } from '../../../shared/getFilePath';
import { Application, AutoApply } from './application.model';
import { APPLICATION_STATUS } from '../../../enums/application';
import { IApplication } from './application.interface';
import { subscriptionHelper } from '../subscription/subscription.helper';
const createApplication = catchAsync(async (req: Request, res: Response) => {
    const { ...applicationData } = req.body;
    const exist = await Application.findOne({ user: (req.user as any).id, post: applicationData.post });
    if (exist) {
        throw new ApiError(400, 'You have already applied for this post');
    }
    const resume = getSingleFilePath(req.files, 'resume');
    const other_documents = getMultipleFilesPath(req.files, 'doc');
    applicationData.user = (req.user as any).id;
    const post = await Post.findById(applicationData.post);
    if (!post) {
        throw new ApiError(404, 'Post not found');
    }

    if(new Date(post?.deadline!)< new Date() || post.status === 'closed') {
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
    const result = await ApplicationServices.getAllApplications(req.query, (req.user as any));
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

    // if([APPLICATION_STATUS.REJECTED,APPLICATION_STATUS.INTERVIEW].includes(application.status)){
    //     throw new ApiError(403, 'You can not update this application');
    // }
     if(body.status == APPLICATION_STATUS.REJECTED){
        if(!body.rejectedReason){
            throw new ApiError(400, 'Rejected reason is required');
        }
       
    }

    

    if(body.status === APPLICATION_STATUS.INTERVIEW){
        if(!body.interviewDetails){
            throw new ApiError(400, 'Interview details are required');
        }

        if(new Date(body.interviewDetails.date)< new Date()){
            throw new ApiError(400, 'Interview date is in the past');
        }

        body.interviewDetails.date = new Date(`${body.interviewDetails.date} ${body.interviewDetails.time}`);
       

    }

    await kafkaProducer.sendMessage("application", {type:"update",data:{_id:id,...body}});
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Application status updated successfully',
        data: body
    });
})

const deleteApplication = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
   await ApplicationServices.deleteApplicationFromDB(id as any,(req.user as any));
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Application deleted successfully',
        data: id
    });
})


const sendFeedBackofInterview = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const body= req.body;
    await kafkaProducer.sendMessage("application", {type:"feedback",data:{_id:id,...body}});
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Feedback sent successfully',
        data: body
    });
})


const autoApplyFeaturesForUser = catchAsync(async (req: Request, res: Response) => {
    const {percentage,title } = req.body;
    const filePath = getSingleFilePath(req.files, 'resume');
    const autoApply = await AutoApply.create({
        user: (req.user as any).id,
        percentage,
        filePath: filePath!,
        title,
    });
   const isPremiumUser = await subscriptionHelper.isPremiumUser((req.user as any).id);
   if(!isPremiumUser){
       throw new ApiError(403, 'You are not a premium user!! Please upgrade your subscription to use this feature.');
   }
    await kafkaProducer.sendMessage("application", {type:"autoApply",data:{user:(req.user as any),percentage,filePath,title,_id:autoApply._id}});
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Auto apply process started successfully',
        data: autoApply
    });
})

const autoApplyResultsForUser = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await ApplicationServices.getAutoApplyResults(id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Auto apply results fetched successfully',
        data: data
    });
})


const recentApplications = catchAsync(async (req: Request, res: Response) => {
    const result = await ApplicationServices.getRecentApplications(req.query, (req.user as any));
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Recent applications fetched successfully',
        data: result.data,
        pagination: result.pagination
    });
})

const getApplicationsByUser = catchAsync(async (req: Request, res: Response) => {
    const result = await ApplicationServices.getUserApplications((req.user as any),req.query);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Applications fetched successfully',
        data: result.data,
        pagination: result.pagination
    });
})


const getApplication = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ApplicationServices.singleApplicationDetails(id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Application fetched successfully',
        data: result
    });
})


const startInterview = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ApplicationServices.startExtarnerNalInterviewOfApplication(id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Interview started successfully',
        data: result
    })
})

const changeTimedateOfIterview = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    let data = req.body
    if(!Boolean(data?.date) || !Boolean(data?.time)){
        throw new ApiError(400, 'Interview details are required');
    }
  
    data = {
        ...data,
        date: new Date(`${data?.date!||''} ${data?.time!||''}`)!
    }
    if(data.date == 'Invalid Date'){
        throw new ApiError(400, 'Invalid date');
        
    }
    if(new Date(data?.date!)< new Date()){
        throw new ApiError(400, 'Interview date is in the past');
    }

    await kafkaProducer.sendMessage("application", {type:"changeInterviewDetails",data:{_id:id,data:data}});
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Interview time updated successfully',
        data: data
    })
})

const cancelInterview = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const application = await Application.findById(id);
    if(!application){
        throw new ApiError(404, 'Application not found');
    }
    if(application.inteviewStatus === "cancelled"){
        throw new ApiError(400, 'Interview is already cancelled');
    }
    if(application.status !== APPLICATION_STATUS.INTERVIEW){
        throw new ApiError(400, 'Application is not in interview');
    }
    if(new Date(application.interviewDetails?.date!)< new Date()){
        throw new ApiError(400, 'Interview date is in the past');
    }
    
    await kafkaProducer.sendMessage("application", {type:"cancelInterview",data:{_id:id,data:req.body.reason}});
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Interview cancelled successfully',
        data: {
            _id:id,
            data:req.body.reason||''
        }
    })
})
export const ApplicationController = {
    createApplication,
    getApplications,
    updateStatusOfApplications,
    deleteApplication,
    sendFeedBackofInterview,
    autoApplyFeaturesForUser,
    autoApplyResultsForUser,
    recentApplications,
    getApplicationsByUser,
    getApplication,
    startInterview,
    changeTimedateOfIterview,
    cancelInterview

};

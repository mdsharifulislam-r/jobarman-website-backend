import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { getMultipleFilesPath, getSingleFilePath } from '../../../shared/getFilePath';
import sendResponse from '../../../shared/sendResponse';
import { UserService } from './user.service';
import { ResumeAnalysis } from './user.model';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { exportJobsToCSV, exportOrganizationsToCSV, exportSubscriptionsToCSV, exportSupportToCSV, exportUsersToCSV, generateJobTablePDF, generateOrganizationTablePDF, generateSubscriptionPDF, generateSupportTablePDF, generateUserTablePDF } from '../../../helpers/printAndCsvHelper';
import { SubscriptionService } from '../subscription/subscription.service';
import ApiError from '../../../errors/ApiError';
import { SpotlightServices } from '../spotlight/spotlight.service';
import { PostServices } from '../post/post.service';
import { SupportServices } from '../support/support.service';
import { Types } from 'mongoose';
import { subscriptionHelper } from '../subscription/subscription.helper';

const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { ...userData } = req.body;
    const result = await UserService.createUserToDB(userData);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User created successfully',
      data: result,
    });
  }
);

const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const user = (req.user as any);
  const result = await UserService.getUserProfileFromDB(user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile data retrieved successfully',
    data: result,
  });
});

//update profile
const updateProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = (req.user as any);

    let image = getSingleFilePath(req.files, 'image');
    console.log(image);
    
    const cover = getSingleFilePath(req.files, 'cover');
    console.log(cover);
    
    const resume = getSingleFilePath(req.files, 'resume');

    const data = {
      image,
      ...req.body,
      cover,
      resume,
    };

    if (req.body?.overview) {
      data.overview = JSON.parse(req.body.overview);
    }

    if (req.body?.contactInfo) {
      data.contactInfo = JSON.parse(req.body.contactInfo);
    }

    if(req.body?.workExperiences){
      console.log(req.body.workExperiences);
      
      data.workExperiences = JSON.parse(req.body.workExperiences);
    }

    if(req.body?.educations){
      data.educations = JSON.parse(req.body.educations);
    }
    const result = await UserService.updateProfileToDB(user, data);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Profile updated successfully',
      data: result,
    });
  }
);

const createGallery = catchAsync(async (req: Request, res: Response) => {
  const image = getMultipleFilesPath(req.files, 'image');
  const result = await UserService.createGalleryIntoDB({
    user: (req.user as any)?.id,
  image: image!,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Gallery created successfully',
    data: result,
  });
});

const getGallery = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getGalleryFromDB((req.user as any));

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Gallery fetched successfully',
    data: result,
  });
});

const deleteGallery = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.deleteGalleryFromDB((req.user as any), id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Gallery deleted successfully',
    data: result,
  });
});

const addEducation = catchAsync(async (req: Request, res: Response) => {
  const { ...educationData } = req.body;
  const result = await UserService.addEducationOfUser((req.user as any), educationData);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Education added successfully',
    data: result,
  });
});
const deleteEducation = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.deleteEducationOfUser((req.user as any), id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Education deleted successfully',
    data: result,
  });
});
const updateEducation = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { ...educationData } = req.body;
  const result = await UserService.updateEducationOfUser(
    (req.user as any),
    {
      _id: id,
      ...educationData,
    }
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Education updated successfully',
    data: result,
  });
});

const addworkExperience = catchAsync(async (req: Request, res: Response) => {
  const { ...workExperienceData } = req.body;
  const result = await UserService.addWorkExperienceOfUser(
    (req.user as any),
    workExperienceData
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Work experience added successfully',
    data: result,
  });
});
const deleteWorkExperience = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.deleteWorkExperienceOfUser((req.user as any), id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Work experience deleted successfully',
    data: result,
  });
});
const updateWorkExperience = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { ...workExperienceData } = req.body;
  const result = await UserService.updateWorkExperienceOfUser(
    (req.user as any),
    {
      _id: id,
      ...workExperienceData,
    }
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Work experience updated successfully',
    data: result,
  });
});

const anlaizeUserResume = catchAsync(async (req: Request, res: Response) => {
  const filePath = getSingleFilePath(req.files, 'resume');
  if(!filePath){
    throw new ApiError(400, 'Resume not found');
  }
  const resumeAnalysis= await ResumeAnalysis.create({
    filePath: filePath!,
  });
  await kafkaProducer.sendMessage("resume", {type:"analyze",data:{id:resumeAnalysis._id,fileId:filePath}});
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Resume analyzed successfully',
    data: resumeAnalysis,
  });
});

const getResultOfResumeAnalysis = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if(!(new Types.ObjectId(id))){
    throw new ApiError(400, 'Invalid id');
  }
  const result = await ResumeAnalysis.findById(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Resume analysis result fetched successfully',
    data: result,
  });
});

const getRecruiterDetailsById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.recruiterDetauilsById(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Recruiter details fetched successfully',
    data: result,
  });
});


const getUserList = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getUsersListFromTheDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User list fetched successfully',
    data: result.data,
    pagination: result.pagination,
  });
})


const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await UserService.blockUnBlockUser(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User status updated successfully',
    data: result,
  });
})

const userListDownLoad = catchAsync(async (req: Request, res: Response) => {

  try {
    if(req.query.downloadItem === 'user'){
      delete req.query.downloadItem
      const result = await UserService.getUsersListFromTheDB(req.query);
      if(req.query.downloadType === 'csv'){
        exportUsersToCSV(result.data, res);
      }else if(req.query.downloadType === 'pdf'){
        generateUserTablePDF(result.data, res);
      }
    }
    else if(req.query.downloadItem === 'sub'){
      delete req.query.downloadItem
      const subscriptionList = await SubscriptionService.subscribedUser(req.query);
      if(req.query.downloadType === 'csv'){
        exportSubscriptionsToCSV(subscriptionList.data as any, res);
      }else if(req.query.downloadType === 'pdf'){
        generateSubscriptionPDF(subscriptionList.data as any, res);
      }
    }
    else if(req.query.downloadItem === 'ad'){
      delete req.query.downloadItem
      const result = await SpotlightServices.getSpotlightsFromDB(req.query, (req.user as any));
      if(req.query.downloadType === 'pdf'){
        generateOrganizationTablePDF(result?.spotlights as any, res);
      }else if(req.query.downloadType === 'csv'){
        exportOrganizationsToCSV(result?.spotlights as any, res);
      }
    }
    else if(req.query.downloadItem === 'job'){
      delete req.query.downloadItem
      const result = await PostServices.getPostsFromDB(req.query, (req.user as any));
      console.log(result);
      
      if(req.query.downloadType === 'csv'){
        exportJobsToCSV(result?.data as any, res);
      }else if(req.query.downloadType === 'pdf'){
        generateJobTablePDF(result?.data as any, res);
      }
    }
    else if(req.query.downloadItem === 'support'){
      delete req.query.downloadItem
      const result = await SupportServices.getAllSupport(req.query);
      if(req.query.downloadType === 'csv'){
        exportSupportToCSV(result?.data as any, res);
      }else if(req.query.downloadType === 'pdf'){
        generateSupportTablePDF(result?.data as any, res);
      }
    }
    else {
      sendResponse(res, {
        success: false,
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Invalid download item',
        data: null
      })
    }
  } catch (error) {
    console.log(error);
    
    sendResponse(res, {
      success: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'something went wrong',
      data: error
    })
  }
})

const toggleAutoApply = catchAsync(async (req: Request, res: Response) => {
   const isPremiumUser = await subscriptionHelper.isPremiumUser((req.user as any).id);
   if(!isPremiumUser){
       throw new ApiError(403, 'You are not a premium user!! Please upgrade your subscription to use this feature.');
   }
  const result = await UserService.toggleAutoApply(req.user as any);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Auto apply updated successfully',
    data: result,
  });
})


const deleteAccount = catchAsync(async (req: Request, res: Response) => {
  const password = req.body.password;
  
  if(!password){
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Password is required');
  }
  const user = req.user as any;
  const result = await UserService.deleteAccountFromDB(user,password);
  
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Account deleted successfully',
    data: result,
  });
})
export const UserController = {
  createUser,
  getUserProfile,
  updateProfile,
  createGallery,
  getGallery,
  deleteGallery,
  addEducation,
  deleteEducation,
  updateEducation,
  addworkExperience,
  deleteWorkExperience,
  updateWorkExperience,
  anlaizeUserResume,
  getResultOfResumeAnalysis,
  getRecruiterDetailsById,
  getUserList,
  updateUserStatus,
  userListDownLoad,
  toggleAutoApply,
  deleteAccount
  
};

import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { getSingleFilePath } from '../../../shared/getFilePath';
import sendResponse from '../../../shared/sendResponse';
import { UserService } from './user.service';
import { ResumeAnalysis } from './user.model';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';

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
    const cover = getSingleFilePath(req.files, 'cover');
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
  const { ...galleryData } = req.body;
  const image = getSingleFilePath(req.files, 'image');
  galleryData.image = image;
  const result = await UserService.createGalleryIntoDB({
    user: (req.user as any)?.id,
    ...galleryData,
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
  const resumeAnalysis= await ResumeAnalysis.create({
    user: (req.user as any).id,
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
  updateUserStatus
  
};

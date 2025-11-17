import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { getSingleFilePath } from '../../../shared/getFilePath';
import sendResponse from '../../../shared/sendResponse';
import { UserService } from './user.service';

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
  const user = req.user;
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
    const user = req.user;

    let image = getSingleFilePath(req.files, 'image');
    const cover = getSingleFilePath(req.files, 'cover');

    const data = {
      image,
      ...req.body,
      cover,
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
    user: req.user?.id,
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
  const result = await UserService.getGalleryFromDB(req.user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Gallery fetched successfully',
    data: result,
  });
});

const deleteGallery = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.deleteGalleryFromDB(req.user, id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Gallery deleted successfully',
    data: result,
  });
});

const addEducation = catchAsync(async (req: Request, res: Response) => {
  const { ...educationData } = req.body;
  const result = await UserService.addEducationOfUser(req.user, educationData);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Education added successfully',
    data: result,
  });
});
const deleteEducation = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.deleteEducationOfUser(req.user, id);
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
    req.user,
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
    req.user,
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
  const result = await UserService.deleteWorkExperienceOfUser(req.user, id);
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
    req.user,
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
};

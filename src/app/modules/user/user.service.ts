import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { USER_ROLES } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import unlinkFile from '../../../shared/unlinkFile';
import generateOTP from '../../../util/generateOTP';
import { IEducation, IUser, IWorkExperience } from './user.interface';
import { Gallery, ResumeAnalysis, User } from './user.model';
import { log } from 'winston';
import { openAiFileUpload } from '../../../helpers/openAiHelper';
import { AIHelper } from '../../../helpers/aiHelper';
import { Post } from '../post/post.model';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import { query } from 'express';
import QueryBuilder from '../../builder/QueryBuilder';

const createUserToDB = async (payload: Partial<IUser>): Promise<IUser> => {
  //set role
  await User.deleteMany({email: payload.email,verified:false});
  const createUser = await User.create(payload);
  if (!createUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user');
  }

  //send email
  const otp = generateOTP();
  const values = {
    name: createUser.name,
    otp: otp,
    email: createUser.email!,
  };
  const createAccountTemplate = emailTemplate.createAccount(values);
  emailHelper.sendEmail(createAccountTemplate);

  //save to DB
  const authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 3 * 60000),
  };
  await User.findOneAndUpdate(
    { _id: createUser._id },
    { $set: { authentication } }
  );

  return createUser;
};

const getUserProfileFromDB = async (
  user: JwtPayload
): Promise<Partial<IUser>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }
  delete isExistUser.password;
  return isExistUser;
};

const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>
): Promise<Partial<IUser | null>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  //unlink file here
  if (payload.image) {
    unlinkFile(isExistUser.image);
  }

  const updateDoc = await User.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });

  return updateDoc;
};

const createGalleryIntoDB = async (payload: any) => {
  const { user } = payload;
  const isExistUser = await User.isExistUserById(user);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }
  const gallery = await Gallery.create(payload);
  return gallery;
};

const getGalleryFromDB = async (user: JwtPayload) => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }
  const gallery = await Gallery.find({ user: id }).sort({ createdAt: -1 });
  await RedisHelper.keyDelete(`user:${id}`);
  return gallery;
};

const deleteGalleryFromDB = async (user: JwtPayload, id: string) => {
  const { id: userId } = user;
  const isExistUser = await User.isExistUserById(userId);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }
  const gallery = await Gallery.findByIdAndDelete(id);
  await RedisHelper.keyDelete(`user:${userId}`);
  return gallery;
};

const addEducationOfUser = async (user: JwtPayload, payload: IEducation) => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }
  const updateDoc = await User.findOneAndUpdate({ _id: id }, {$addToSet: { educations: payload }}, {
    new: true,
  });
  return updateDoc;
};

const updateEducationOfUser = async (user: JwtPayload, payload: IEducation) => {
  const { id } = user;
  const isExistUser = await User.findById(id)?.lean();
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }
  
  const educations = isExistUser?.educations?.map((education:any) => {
    if (education._id?.toString() === payload._id) {
      return {
        ...education,
        ...payload,
      };
    }
    return education;
  })

  
  const education = await User.findOneAndUpdate({ _id: id,},{educations},{new : true});
  return education;
};

const deleteEducationOfUser = async (user: JwtPayload, id: string) => {
  const { id: userId } = user;
  const isExistUser = await User.isExistUserById(userId);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }
  const education = await User.findOneAndUpdate({ _id: userId }, {$pull: { educations: { _id: id } }}, {
    new: true,
  });
  return education;
};

const addWorkExperienceOfUser = async (user: JwtPayload, payload: IWorkExperience) => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }
  const updateDoc = await User.findOneAndUpdate({ _id: id }, {$addToSet: { workExperiences: payload }}, {
    new: true,
  });
  return updateDoc;
};

const updateWorkExperienceOfUser = async (user: JwtPayload, payload: IWorkExperience) => {
  const { id } = user;
  const isExistUser = await User.findById(id)?.lean();
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  
  
  const workExperiences = isExistUser?.workExperiences?.map((workExperience:any) => {
    if (workExperience._id?.toString() === payload._id) {
      return {
        ...workExperience,
        ...payload,
      };
    }
    return workExperience;
  })
  
  const workExperience = await User.findOneAndUpdate({ _id: id,},{workExperiences},{new : true});
  return workExperience;
};

const deleteWorkExperienceOfUser = async (user: JwtPayload, id: string) => {
  const { id: userId } = user;
  const isExistUser = await User.findById(userId);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }
  const workExperience = await User.findOneAndUpdate({ _id: userId }, {$pull: { workExperiences: { _id: id } }}, {
    new: true,
  });
  return workExperience;
};

const anlaizeUserResume = async (cvPath:string,id:string) => {
  const fileId = await openAiFileUpload(cvPath);
  const result = await AIHelper.analizeResumeHelper(fileId!);
  const io = (global as any ).io;
  io.emit(`resume-analysis::${id}`,result);
  await ResumeAnalysis.updateOne({_id:id},{analysis:result,status:"completed"},{upsert:true});

  return result;
}

const getResultOfResumeAnalysis = async (id:string) => {
  const result = await ResumeAnalysis.findById(id);
  return result;
}

const recruiterDetauilsById = async (id:string) => {
  const cache = await RedisHelper.redisGet(`user:${id}`);
  if(cache){
    console.log('cache');
    
    return cache;
  }
  const user = await User.findById(id).lean();
  if(!user){
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  const gallery = await Gallery.find({user:id}).lean();
  const recentJobs = await Post.find({recruiter:id}).sort({createdAt:-1}).limit(5).lean();
  const data = {
    user:user,
    gallery:gallery?.map(g=>g.image) || [],
    recentJobs: recentJobs
  }
  await RedisHelper.redisSet(`user:${id}`,data);
  return data;
}


const getUsersListFromTheDB = async (query: Record<string, any>) => {
  const cache = await RedisHelper.redisGet(`users`,query)
  if(cache){
      console.log("from cache");
      return cache
  }
  const userQuery = new QueryBuilder(User.find({status: "active"}), query).paginate().sort().search(['name', 'email']).filter()
  const [users, pagination] = await Promise.all([
    userQuery.modelQuery.exec(),
    userQuery.getPaginationInfo()
  ])
  const data = {
    data: users,
    pagination
  }

  await RedisHelper.redisSet(`users`,data,query)
  return data
}


const blockUnBlockUser = async (id:string) => {
  const user = await User.findById(id);
  if(!user){
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }
  await user.updateOne({status:user.status === "active" ? "delete" : "active"},{new:true});
  return user;
}

export const UserService = {
  createUserToDB,
  getUserProfileFromDB,
  updateProfileToDB,
  createGalleryIntoDB,
  getGalleryFromDB,
  deleteGalleryFromDB,
  addEducationOfUser,
  updateEducationOfUser,
  deleteEducationOfUser,
  addWorkExperienceOfUser,
  updateWorkExperienceOfUser,
  deleteWorkExperienceOfUser,
  anlaizeUserResume,
  getResultOfResumeAnalysis,
  recruiterDetauilsById,
  getUsersListFromTheDB,
  blockUnBlockUser
};

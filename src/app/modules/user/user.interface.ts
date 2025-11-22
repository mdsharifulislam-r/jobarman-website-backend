import { Model, Types } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';

export type IUser = {
  name: string;
  role: USER_ROLES;
  isSocialLogin: boolean;
  email: string;
  gender?: string;
  date_of_birth?: Date;
  nationality?: string;
  language?: string;
  address?: string;
  phone?: string;
  linkedin?: string;
  designation?: string;
  password: string;
  image?: string;
  status: 'active' | 'delete';
  verified: boolean;
  authentication?: {
    isResetPassword: boolean;
    oneTimeCode: number;
    expireAt: Date;
  };
  subscription?:Types.ObjectId,
  bio?:string,
  cover?:string,
  about_us?:string,
  mission?:string,
  overview?:{
    total_employees?:number,
    company_type?:string,
    founded?:number,
    revenue?:string,
  },
  contactInfo?:{
    website?:string,
    email?:string,
    contact?:string,
    address?:string
  },
  educations?:IEducation[],
  workExperiences?:IWorkExperience[],
  skills?:string[],
};

export type IEducation = {
  degree: string;
  institute: string;
  startDate: Date;
  endDate: Date;
  passingYear: number;
  grade: string;
  _id?: Types.ObjectId;
}
export type IWorkExperience = {
  title: string;
  company: string;
  startDate: Date;
  endDate: Date;
  description: string;
  location: string;
  isCurrentJob: boolean;
  _id?: Types.ObjectId
}
export type IGallary = {
  image: string;
  user: Types.ObjectId;
};

export type UserModal = {
  isExistUserById(id: string): any;
  isExistUserByEmail(email: string): any;
  isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;


export type IResumeAnalysis = {
  user: Types.ObjectId,
  filePath: string,
  analysis: any,
  status?: 'pending' | 'completed'
}

export type IResumeAnalysisModal = Model<IResumeAnalysis>;

export type IGallaryModal = Model<IGallary>;

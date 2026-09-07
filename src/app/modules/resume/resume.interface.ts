import { Model, Types } from 'mongoose';
import { IEducation, IWorkExperience } from '../user/user.interface';
import { JOB_LEVEL } from '../../../enums/post';

export type IResume = {
  resume_name: string;
  user:Types.ObjectId
  personalInfo: {
    full_name: string;
    email: string;
    phone: string;
    social_media_link: string;
    github_link: string;
    work_authorization: string;
    clearance: string;
    open_to_work: string;
    summury: string;
    address: string;
    date_of_birth: Date;
    age: number;
    nationality: string;
    language: string;
    gender: string;
  },
  educations:IEducation[],
  workExperiences:IWorkExperience&{designation:string}[],
  skills:string[],
  core_features:{
    title:string,
    description:string
  }[],
  projects: {
    title: string;
    description: string;
    link?: string;
  }[],
  certifications: {
    title: string;
    description?: string;
    link?: string;
  }[],
  pdf?: string;
  is_external_resume?: boolean;
};

export type ResumeModel = Model<IResume>;



export interface IResumeExtractedData {
  date_of_birth?: Date;
  nationality?: string;
  language?: string;
  user:Types.ObjectId
  address?: string;
  linkedin?: string;
  designation?: string;
  bio?: string;
  educations?: IEducation[];
  workExperiences?: IWorkExperience[];
  skills?: string[];
  job_level:JOB_LEVEL
}

export type ResumeExtractedDataModel = Model<IResumeExtractedData>;
import { Model, Types } from 'mongoose';
import { IEducation, IWorkExperience } from '../user/user.interface';

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
  }[]
};

export type ResumeModel = Model<IResume>;

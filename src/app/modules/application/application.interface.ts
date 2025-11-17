import { Model, Types } from 'mongoose';
import { APPLICATION_STATUS } from '../../../enums/application';

export type IApplication = {
  user:Types.ObjectId,
  post:Types.ObjectId,
  recruiter:Types.ObjectId,
  title:string,
  year_of_experience:string,
  resume:string
  other_documents:string[],
  status:APPLICATION_STATUS,
  isInterviewCompleted?:boolean,
  history?:{title:string,description?:string,date?:Date}[],
  rejectedReason?:string,
  jobMatch ?: number,
  interviewDetails?:{
    date:Date,
    time:string,
    interview_type:"remote" | "onsite"
  }
};

export type ApplicationModel = Model<IApplication>;

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
  },
  inteviewStatus?:"pending" | "complete" |"cancelled",
  cancelledReason?:string,
  hiringStatus?:"on hold" | "hired" | "rejected" | "shortlisted",
  user_deleted?:boolean,
  reqruiter_deleted?:boolean,
  feedback?:string,
  isAutoApplied?:boolean,
  autoApplyId?:Types.ObjectId
};

export type IAutoApply = {
  user:Types.ObjectId,
  date:Date,
  percentage:number,
  filePath:string,
  title:string,
  totalApplied?:number,
  successfulApplied?:number,
  posts?:Types.ObjectId[],
}


export type ApplicationModel = Model<IApplication>;
export type AutoApplyModel = Model<IAutoApply>;

export type IInterview = {
  date:Date,
  time:string,
  interview_type:"remote" | "onsite",
  candidate:Types.ObjectId,
  recruiter:Types.ObjectId,
  post:Types.ObjectId,
  application:Types.ObjectId,
  status:"pending" | "completed" | "cancelled",
  cancelledReason?:string
}

export type InterviewModel = Model<IInterview>;

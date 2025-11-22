import { Schema, model } from 'mongoose';
import { IApplication, ApplicationModel, IInterview, InterviewModel, IAutoApply, AutoApplyModel } from './application.interface'; 
import { APPLICATION_STATUS } from '../../../enums/application';

const applicationSchema = new Schema<IApplication, ApplicationModel>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  recruiter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  year_of_experience: { type: String, required: true },
  resume: { type: String, required: true },
  other_documents: { type: [String], required: false },
  status: { type: String, enum: Object.values(APPLICATION_STATUS), default: APPLICATION_STATUS.PENDING },
  isInterviewCompleted: { type: Boolean, default: false },
  history: { type: [{ title: String, description: String, date: Date,status: String }], required: false, default: [{title:'Pending',description:'Application sent to recruiter',date:new Date()}] },
  rejectedReason: { type: String, required: false },
  jobMatch: { type: Number, required: false },
  interviewDetails: {
    date: { type: Date, required: false },
    time: { type: String, required: false },
    interview_type: { type: String, enum: ['remote', 'onsite'], required: false },
  },
  inteviewStatus: { type: String, enum: ['pending', 'complete', 'cancelled'], default: 'pending' },
  cancelledReason: { type: String, required: false },
  hiringStatus: { type: String, enum: ['on hold', 'hired', 'rejected', 'shortlisted'], default: 'on hold' },
  user_deleted: { type: Boolean, default: false },
  reqruiter_deleted: { type: Boolean, default: false },
  feedback: { type: String, required: false },
  isAutoApplied: { type: Boolean, default: false },
  autoApplyId: { type: Schema.Types.ObjectId, ref: 'AutoApply', required: false },
},{
  timestamps:true
});

export const Application = model<IApplication, ApplicationModel>('Application', applicationSchema);

const interviewSchema  = new Schema<IInterview,InterviewModel>({
  application: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  interview_type: { type: String, enum: ['remote', 'onsite'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  candidate: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recruiter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  cancelledReason: { type: String, required: false },
},{
  timestamps:true
});


export const Interview = model<IInterview,InterviewModel>('Interview',interviewSchema);


const autoApplySchema = new Schema<IAutoApply,AutoApplyModel>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  percentage: { type: Number, required: true },
  filePath: { type: String, required: true },
  title: { type: String, required: true },
  date: { type: Date, default: new Date() },
  totalApplied:{type:Number,default:0},
  successfulApplied:{type:Number,default:0},
  posts: [{ type: Schema.Types.ObjectId, ref: 'Post', required: false }]
},{
  timestamps:true
});

export const AutoApply = model<IAutoApply,AutoApplyModel>('AutoApply',autoApplySchema);
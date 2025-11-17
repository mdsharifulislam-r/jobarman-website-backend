import { Schema, model } from 'mongoose';
import { IApplication, ApplicationModel } from './application.interface'; 
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
  history: { type: [{ title: String, description: String, date: Date }], required: false, default: [{title:'Pending',description:'Application sent to recruiter',date:new Date()}] },
  rejectedReason: { type: String, required: false },
  jobMatch: { type: Number, required: false },
  interviewDetails: {
    date: { type: Date, required: false },
    time: { type: String, required: false },
    interview_type: { type: String, enum: ['remote', 'onsite'], required: false },
  }
});

export const Application = model<IApplication, ApplicationModel>('Application', applicationSchema);

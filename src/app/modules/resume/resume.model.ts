import { Schema, model } from 'mongoose';
import { IResume, ResumeModel } from './resume.interface'; 

const resumeSchema = new Schema<IResume, ResumeModel>({
  resume_name: { type: String, required: false },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  personalInfo: {
    full_name: { type: String, required: false },
    email: { type: String, required: false },
    phone: { type: String, required: false },
    social_media_link: { type: String, required: false },
    github_link: { type: String, required: false },
    work_authorization: { type: String, required: false },
    clearance: { type: String, required: false },
    open_to_work: { type: String, required: false },
    summury: { type: String, required: false },
    address: { type: String, required: false },
    date_of_birth: { type: Date, required: false },
    age: { type: Number, required: false },
    nationality: { type: String, required: false },
    language: { type: String, required: false },
    gender: { type: String, required: false },
  },
  educations: {
    type:[{
      degree: { type: String, required: false },
      institution: { type: String, required: false },
      startDate: { type: Date, required: false },
      endDate: { type: Date, required: false },
      grade: { type: String, required: false },
      passingYear: { type: Number, required: false },
    }]
  },
  workExperiences: [{
    title: { type: String, required: false },
    company: { type: String, required: false },
    startDate: { type: Date, required: false },
    endDate: { type: Date, required: false },
    description: { type: String, required: false },
    location: { type: String, required: false },
    isCurrentJob: { type: Boolean, required: false },
    designation: { type: String, required: false },
  }],
  skills: {
    type:[String]
  },
  core_features:{
    type:[{
      title: { type: String, required: false },
      description: { type: String, required: false },
    }]
  },
  certifications: {
    type:[{
      title: { type: String, required: false },
      description: { type: String, required: false },
      link: { type: String, required: false },
    }]
  },
  projects: {
    type:[{
      title: { type: String, required: false },
      description: { type: String, required: false },
      link: { type: String, required: false },
    }]
  },
  is_external_resume: { type: Boolean, required: false,default:false },
  pdf: { type: String, required: false },
},
{ timestamps: true });

export const Resume = model<IResume, ResumeModel>('Resume', resumeSchema);

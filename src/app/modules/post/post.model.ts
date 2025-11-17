import { Schema, model } from 'mongoose';
import { IPost, PostModel } from './post.interface'; 
import { EXPERIENCE_LEVEL, JOB_LEVEL, JOB_TYPE } from '../../../enums/post';

const postSchema = new Schema<IPost, PostModel>({
  thumbnail: { type: String, required: true },
  recruiter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  job_type: {
    type: String,
    enum: Object.values(JOB_TYPE),
    required: true,
  },
  job_level: {
    type: String,
    enum: Object.values(JOB_LEVEL),
    required: true,
  },
  experience_level: {
    type: String,
    enum: Object.values(EXPERIENCE_LEVEL),
    required: true,
  },
  min_salary: { type: Number, required: true },
  max_salary: { type: Number, required: true },
  location: { type: String, required: true },
  required_skills: { type: [String], required: false },
  deadline: { type: Date, required: true },
  is_deleted: {
    type: Boolean,
    default: false,
  }
},{
    timestamps: true
});

export const Post = model<IPost, PostModel>('Post', postSchema);

import { Schema, model } from 'mongoose';
import { IPost, PostModel } from './post.interface'; 
import { EXPERIENCE_LEVEL, JOB_LEVEL, JOB_TYPE } from '../../../enums/post';
import { getFromOSM } from '../../../helpers/mapHelper';

const postSchema = new Schema<IPost, PostModel>({
  thumbnail: { type: String, required: false,default:''},
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
  gioLocation: {
    type: {
      type: String,
      enum: ['Point'],
      required: false,
    },
    coordinates: {
      type: [Number],
      required: false,
    },
  },
  is_deleted: {
    type: Boolean,
    default: false,
  },
  responsibilities: { type: [String], required: false },
  benefits: { type: [String], required: false },
},{
    timestamps: true
});

postSchema.index({recruiter: 1})
postSchema.index({gioLocation: '2dsphere'})
postSchema.pre('save', async function (next) {
  try {
      const latong = await getFromOSM(this.location);
  this.gioLocation = {
    type: 'Point',
    coordinates: [latong.latitude, latong.longitude],
  }
  next();
  } catch (error) {
    next();
  }
})

export const Post = model<IPost, PostModel>('Post', postSchema);

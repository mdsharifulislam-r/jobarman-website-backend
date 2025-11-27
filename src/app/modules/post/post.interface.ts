import { Model, Types } from 'mongoose';
import { EXPERIENCE_LEVEL, JOB_LEVEL, JOB_TYPE } from '../../../enums/post';

export type IPost = {
  thumbnail: string;
  recruiter: Types.ObjectId;
  title: string;
  description: string;
  status: "active" | "closed";
  category: Types.ObjectId;
  job_type: JOB_TYPE;
  job_level: JOB_LEVEL;
  experience_level: EXPERIENCE_LEVEL;
  min_salary: number;
  max_salary: number;
  location: string;
  required_skills: string[];
  deadline: Date;
  is_deleted: boolean;
  gioLocation?:{
    type: "Point",
    coordinates: [number, number]
  }
  
};

export type PostModel = Model<IPost>;

import { Model, Types } from 'mongoose';
import { EXPERIENCE_LEVEL, JOB_LEVEL, JOB_TYPE } from '../../../enums/post';

export type IPost = {
  thumbnail: string;
  recruiter?: Types.ObjectId;
  recruiter_company?: string;
  job_url?: string;
  title: string;
  description: string;
  status: "active" | "closed";
  category?: Types.ObjectId;
  job_type: JOB_TYPE;
  job_level: JOB_LEVEL;
  experience_level: EXPERIENCE_LEVEL;
  min_salary?: number;
  max_salary?: number;
  salary_currency?: string;
  salary_status?: string;
  category_string?: string;
  salary_recurring?: string;
  location: string;
  required_skills: string[];
  deadline?: Date;
  is_deleted: boolean;
  gioLocation?:{
    type: "Point",
    coordinates: [number, number]
  }
  responsibilities?: string[];
  benefits?: string[];
  is_third_party_job?: boolean;
  job_board?:string,
  post_date?:Date,
  is_repost?:boolean
  prevPostId?:Types.ObjectId,
  prevImage?:string,
  unique_id?:string,
  cursor?:number,
  work_mode?:string,
  company_contact_email?:string
  
};

export type PostModel = Model<IPost>;

import { Model, Types } from 'mongoose';

export type IReview = {
  user:Types.ObjectId,
  rating:number,
  comment:string,
  status:"pending" | "published" | "rejected"
};

export type ReviewModel = Model<IReview>;

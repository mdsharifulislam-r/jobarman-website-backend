import { Model, Types } from 'mongoose';

export type IReview = {
  user:Types.ObjectId,
  rating:number,
  comment:string,
};

export type ReviewModel = Model<IReview>;

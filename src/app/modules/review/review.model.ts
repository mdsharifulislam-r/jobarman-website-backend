import { Schema, model } from 'mongoose';
import { IReview, ReviewModel } from './review.interface'; 

const reviewSchema = new Schema<IReview, ReviewModel>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
},{
  timestamps:true
});

export const Review = model<IReview, ReviewModel>('Review', reviewSchema);

import { Schema, model } from 'mongoose';
import { ICategory, CategoryModel } from './category.interface'; 

const categorySchema = new Schema<ICategory, CategoryModel>({
  image: { type: String, required: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['active', 'delete'], default: 'active' },
  _job_count: { type: Number, default: 0, select: false },
});

export const Category = model<ICategory, CategoryModel>('Category', categorySchema);

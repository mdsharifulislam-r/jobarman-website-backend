import { Schema, model } from 'mongoose';
import { ICategory, CategoryModel } from './category.interface'; 

const categorySchema = new Schema<ICategory, CategoryModel>({
  image: { type: String, required: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['active', 'delete'], default: 'active' },
});

export const Category = model<ICategory, CategoryModel>('Category', categorySchema);

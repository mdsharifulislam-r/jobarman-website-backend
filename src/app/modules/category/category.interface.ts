import { Model } from 'mongoose';

export type ICategory = {
  name: string;
  image: string;
  status: "active" | "delete";
};

export type CategoryModel = Model<ICategory>;

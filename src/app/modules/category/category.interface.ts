import { Model } from 'mongoose';

export type ICategory = {
  name: string;
  image: string;
  status: "active" | "delete";
  _job_count?: number;
};

export type CategoryModel = Model<ICategory>;

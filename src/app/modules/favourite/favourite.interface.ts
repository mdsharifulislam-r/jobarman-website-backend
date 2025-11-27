import { Model, Types } from 'mongoose';

export type IFavourite = {
  user: Types.ObjectId;
  post: Types.ObjectId;
};

export type FavouriteModel = Model<IFavourite>;

import { Schema, model } from 'mongoose';
import { IFavourite, FavouriteModel } from './favourite.interface'; 

const favouriteSchema = new Schema<IFavourite, FavouriteModel>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
},{
  timestamps:true
});

export const Favourite = model<IFavourite, FavouriteModel>('Favourite', favouriteSchema);

import { JwtPayload } from 'jsonwebtoken';
import { FavouriteModel, IFavourite } from './favourite.interface';
import { Favourite } from './favourite.model';
import QueryBuilder from '../../builder/QueryBuilder';

const createFavouriteInDB = async (favourite: Partial<IFavourite>): Promise<IFavourite> => {
    const isExist = await Favourite.findOne({ user: favourite.user, post: favourite.post });
    if(isExist){
        await Favourite.findByIdAndDelete(isExist._id);
        return isExist;
    }
    const result = await Favourite.create(favourite);
    return result;
}

const getFavouritesFromDB = async (user:JwtPayload,query:Record<string,any>) => {
    const {id} = user;
    const favouriteQuery= new QueryBuilder(Favourite.find({user:id}),query).paginate().sort()
    const [favourites,pagination] = await Promise.all([
        favouriteQuery.modelQuery.populate('post').exec(),
        favouriteQuery.getPaginationInfo()
    ])
    return {
        data:favourites,
        pagination
    }
}

export const FavouriteServices = { createFavouriteInDB, getFavouritesFromDB };
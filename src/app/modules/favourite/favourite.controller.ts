import { Request, Response, NextFunction } from 'express';
import { FavouriteServices } from './favourite.service';
import catchAsync from '../../../shared/catchAsync';
const createFavourite = catchAsync(async (req: Request, res: Response) => {
    const favouriteData = req.body;
    favouriteData.user = (req.user as any).id;
    const result = await FavouriteServices.createFavouriteInDB(favouriteData);
    res.status(200).json({
        success: true,
        message: 'Favourite toggled successfully',
        data: result
    });
});

const getFavourites = catchAsync(async (req: Request, res: Response) => {
    const result = await FavouriteServices.getFavouritesFromDB((req.user as any), req.query);
    res.status(200).json({
        success: true,
        message: 'Favourites fetched successfully',
        data: result.data,
        pagination: result.pagination
    });
});
export const FavouriteController = { createFavourite, getFavourites };
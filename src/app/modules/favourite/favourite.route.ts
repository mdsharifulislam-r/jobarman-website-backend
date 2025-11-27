import express from 'express';
import { FavouriteController } from './favourite.controller';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { FavouriteValidations } from './favourite.validation';

const router = express.Router();

router.route("/")
    .post(auth(),validateRequest(FavouriteValidations.createFavouriteZodSchema),FavouriteController.createFavourite)
    .get(auth(),FavouriteController.getFavourites)

export const FavouriteRoutes = router;

import express from 'express';
import { ReviewController } from './review.controller';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ReviewValidations } from './review.validation';

const router = express.Router();

router.route('/')
    .post(auth(),validateRequest(ReviewValidations.createReviewSchema),ReviewController.createReview)
    .get(ReviewController.getReviews); 

export const ReviewRoutes = router;

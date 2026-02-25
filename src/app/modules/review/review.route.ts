import express from 'express';
import { ReviewController } from './review.controller';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ReviewValidations } from './review.validation';
import tempAuth from '../../middlewares/tempAuth';

const router = express.Router();

router.route('/')
    .post(auth(),validateRequest(ReviewValidations.createReviewSchema),ReviewController.createReview)
    .get(tempAuth(),ReviewController.getReviews); 

router.route('/:id')
    .patch(auth(),validateRequest(ReviewValidations.changeStatusReviewSchema),ReviewController.changeStatusReview)

export const ReviewRoutes = router;

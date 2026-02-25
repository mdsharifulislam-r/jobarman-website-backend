import { Request, Response, NextFunction } from 'express';
import { ReviewServices } from './review.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

const createReview = catchAsync(async (req: Request, res: Response) => {
    const { ...reviewData } = req.body;
    reviewData.user = (req.user as any).id;
    const result = await ReviewServices.createReviewInDB(reviewData);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Review created successfully',
        data: result
    });
})

const getReviews = catchAsync(async (req: Request, res: Response) => {
    const result = await ReviewServices.getReviewsFromDB(req.query, (req.user as any)!);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Reviews fetched successfully',
        data: result.data,
        pagination: result.pagination
    });
})


const changeStatusReview = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await ReviewServices.changeStatusReview(id, status);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Review status changed successfully',
        data: result
    });
})

export const ReviewController = { 
    createReview,
    getReviews,
    changeStatusReview
};
import { Types } from 'mongoose';
import { z } from 'zod';
const createReviewSchema = z.object({
    body: z.object({
        rating: z.number().min(1).max(5),
        comment: z.string().min(1)
    })
})


const changeStatusReviewSchema = z.object({
    params: z.object({
        id: z.string().refine((v) => Types.ObjectId.isValid(v), { message: 'Id must be a valid ObjectId' }),
    }),
    body: z.object({
        status: z.enum([ 'rejected', 'published'])
    })
})
export const ReviewValidations = { 
    createReviewSchema,
    changeStatusReviewSchema
};
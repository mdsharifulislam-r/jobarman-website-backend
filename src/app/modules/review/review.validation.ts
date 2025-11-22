import { z } from 'zod';
const createReviewSchema = z.object({
    body: z.object({
        rating: z.number().min(1).max(5),
        comment: z.string().min(1)
    })
})
export const ReviewValidations = { 
    createReviewSchema
};
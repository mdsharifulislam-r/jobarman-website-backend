import { z } from 'zod';
const createFavouriteZodSchema = z.object({
  body: z.object({
    post: z.string().min(1, { message: 'Post ID is required' }).refine((v) => v.match(/^[0-9a-fA-F]{24}$/), { message: 'Post ID must be a valid ObjectId' }),
  }),
})
export const FavouriteValidations = { createFavouriteZodSchema };

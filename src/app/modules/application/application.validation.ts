import { z } from 'zod';
import { APPLICATION_STATUS } from '../../../enums/application';
import { Types } from 'mongoose';
export const applicationSchema = z.object({
  post: z.string().refine((v) => Types.ObjectId.isValid(v), { message: 'Post must be a valid ObjectId' }),
  title: z.string().min(2, { message: 'Title must be at least 2 characters' }),
  year_of_experience: z.string().min(2, { message: 'Year of experience must be at least 2 characters' }),
  resume: z.any(),
  other_documents: z.array(z.any()).optional(),
});

const createApplicationZodSchema = z.object({
  body: z.object({
    post: z.string().refine((v) => Types.ObjectId.isValid(v), { message: 'Post must be a valid ObjectId' }),
    title: z.string().min(1, { message: 'Title must be at least 2 characters' }),
    year_of_experience: z.string().min(1, { message: 'Year of experience must be at least 2 characters' }),
    resume: z.any(),
    doc: z.array(z.any()).optional(),
  }),
})
export const ApplicationValidations = {
  createApplicationZodSchema
};

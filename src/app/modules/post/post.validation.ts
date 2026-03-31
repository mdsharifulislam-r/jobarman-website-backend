import { z } from 'zod';
import { EXPERIENCE_LEVEL, JOB_LEVEL, JOB_TYPE } from '../../../enums/post';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';

const createPostZodSchema = z
  .object({
    body: z.object({
      image: z.any(),
      title: z.string().min(2, 'Title too short'),
      description: z.string(),
      category: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId'),
      job_type: z.nativeEnum(JOB_TYPE),
      job_level: z.nativeEnum(JOB_LEVEL),
      experience_level: z.nativeEnum(EXPERIENCE_LEVEL),
      min_salary: z
        .string()
        .refine(v => Number(v) >= 0, 'min_salary must be >= 0'),
      max_salary: z
        .string()
        .refine(v => Number(v) >= 0, 'max_salary must be >= 0'),
      location: z.string().min(2),
      required_skills: z.array(z.string().min(1)).optional().default([]),
      deadline: z.preprocess(arg => {
        if (typeof arg === 'string' || arg instanceof Date) {
          if (new Date(arg) < new Date()) {
            throw new ApiError(
              StatusCodes.BAD_REQUEST,
              'Deadline must be greater than current date',
            );
          }
          return new Date(arg);
        }
      }, z.date()),
    }),
  })
  .refine(({ body }) => {
    if (Number(body.min_salary) > Number(body.max_salary)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'min_salary must be less than max_salary',
      );
    }
    return true;
  });

const updatePostZodSchema = z.object({
  body: z.object({
    thumbnail: z.any().optional(),
    title: z.string().min(2, 'Title too short').optional(),
    description: z.string().min(10, 'Description too short').optional(),
    status: z.enum(['active', 'closed']).optional(),
    category: z
      .string()
      .regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId')
      .optional(),
    job_type: z.nativeEnum(JOB_TYPE).optional(),
    job_level: z.nativeEnum(JOB_LEVEL).optional(),
    experience_level: z.nativeEnum(EXPERIENCE_LEVEL).optional(),
    min_salary: z
      .string()
      .refine(v => Number(v) >= 0, 'min_salary must be >= 0')
      .optional(),
    max_salary: z
      .string()
      .refine(v => Number(v) >= 0, 'max_salary must be >= 0')
      .optional(),
    location: z.string().min(2).optional(),
    required_skills: z.array(z.string().min(1)).optional(),
    deadline: z
      .preprocess(arg => {
        if (typeof arg === 'string' || arg instanceof Date) {
          if (new Date(arg) < new Date()) {
            throw new ApiError(
              StatusCodes.BAD_REQUEST,
              'Deadline must be greater than current date',
            );
          }
          return new Date(arg);
        }
      }, z.date())
      .optional(),
  }),
});

export const PostValidations = {
  createPostZodSchema,
  updatePostZodSchema,
};

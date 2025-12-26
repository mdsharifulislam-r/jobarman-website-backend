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
    doc: z.any(),
  }),
})

const changeStatusSchema = z.object({
  params: z.object({
    id: z.string().refine((v) => Types.ObjectId.isValid(v), { message: 'Id must be a valid ObjectId' }),
  }),
  body: z.object({
    status: z.nativeEnum(APPLICATION_STATUS),
    reason: z.string().optional(),
    interviewDetails: z.object({
      date: z.string().optional(),
      time: z.string().optional(),
      interview_type: z.enum(['remote', 'onsite']).optional()
    }).optional()
  })
})

const sendFeedBackSchema = z.object({
  params: z.object({
    id: z.string().refine((v) => Types.ObjectId.isValid(v), { message: 'Id must be a valid ObjectId' }),
  }),
  body: z.object({
    feedback: z.string(),
    hiringStatus: z.enum(['on hold', 'hired', 'rejected', 'shortlisted'])
  })
})

const autoApplySchema = z.object({
  body: z.object({
    percentage: z.string().refine((v) => !isNaN(Number(v)) && Number(v) >=0 && Number(v) <=100, { message: 'Percentage must be a number between 0 and 100' }),
    title: z.string().min(2, { message: 'Title must be at least 2 characters' }),
    resume: z.any(),
  }),
})

const changeInterviewDetailsZodSchema = z.object({
  params: z.object({
    id: z.string().refine((v) => Types.ObjectId.isValid(v), { message: 'Id must be a valid ObjectId' }),
  }),
  body: z.object({
    date: z.string().optional(),
    time: z.string().optional(),
    interview_type: z.enum(['remote', 'onsite']).optional()
  })
})

const cancelApplicationZodSchema = z.object({
  params: z.object({
    id: z.string().refine((v) => Types.ObjectId.isValid(v), { message: 'Id must be a valid ObjectId' }),
  }),
  body: z.object({
    reason: z.string().optional(),
  })
})
export const ApplicationValidations = {
  createApplicationZodSchema,
  changeStatusSchema,
  sendFeedBackSchema,
  autoApplySchema,
  changeInterviewDetailsZodSchema,
  cancelApplicationZodSchema
};

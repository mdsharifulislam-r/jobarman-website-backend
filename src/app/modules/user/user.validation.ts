import { z } from 'zod';
import { USER_ROLES } from '../../../enums/user';

const createUserZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }),
    email: z.string({ required_error: 'Email is required' }),
    password: z.string({ required_error: 'Password is required' }),
    role:z.nativeEnum(USER_ROLES,{required_error:'Role is required'}),
    profile: z.string().optional(),
  }),
});

const updateUserZodSchema = z.object({
  name: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().optional(),
  password: z.string().optional(),
  location: z.string().optional(),
  image: z.string().optional(),
  role:z.nativeEnum(USER_ROLES).optional(),
  linkedin: z.string().url().optional(),
});

const addEducationZodSchema = z.object({
  body: z.object({
    degree: z.string({ required_error: 'Degree is required' }),
    institute: z.string({ required_error: 'Institute is required' }),
    startDate: z.string({ required_error: 'Start date is required' }),
    endDate: z.string({ required_error: 'End date is required' }),
    passingYear: z.number({ required_error: 'Passing year is required' }),
    grade: z.string({ required_error: 'Grade is required' }),
    skills: z.array(z.string()).optional(),
  }),
})

const addWorkExperienceZodSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }),
    company: z.string({ required_error: 'Company is required' }),
    startDate: z.string({ required_error: 'Start date is required' }),
    endDate: z.string({ required_error: 'End date is required' }),
    description: z.string({ required_error: 'Description is required' }),
    location: z.string({ required_error: 'Location is required' }),
    isCurrentJob: z.boolean({ required_error: 'Is current job is required' }),
  }),
})

const analyzeResumeZodSchema = z.object({
  body: z.object({
    resume: z.any({ required_error: 'Resume file is required' }),
    role: z.string({ required_error: 'Role is required' }),
  }),
})

export const UserValidation = {
  createUserZodSchema,
  updateUserZodSchema,
  addEducationZodSchema,
  addWorkExperienceZodSchema,
  analyzeResumeZodSchema
};

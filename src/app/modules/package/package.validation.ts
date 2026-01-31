import { z } from 'zod';
import { PACKAGE_TYPE } from '../../../enums/package';
export const createPackageZodSchema = z.object({
  body: z.object({
    name: z.nativeEnum(PACKAGE_TYPE),
    price: z.number({ required_error: 'Price is required' }),
    for: z.enum(['employee', 'recruiter'], {
      required_error: 'For is required',
    }),
    features: z.array(z.string()).min(1, { message: 'Features is required' }),
    paymentId: z.string().optional(),
    referenceId: z.string().optional(),
    recurring: z.enum(['month', 'year']),
    interval: z.number().optional().default(1),
  }),
});

const updatePackageZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    price: z.number().optional(),
    perfect_for: z.string().optional(),
    features: z.array(z.string()).optional(),
    paymentId: z.string().optional(),
    referenceId: z.string().optional(),
    recurring: z.enum(['month', 'year']).optional(),
  }),
});

export const PackageValidation = {
  createPackageZodSchema,
  updatePackageZodSchema,
};

import { z } from 'zod';
const createSupportZodSchema = z.object({
    body: z.object({
        reason: z.string({ required_error: 'Reason is required' }),
        description: z.string({ required_error: 'Description is required' }),
        image: z.array(z.any()).optional(),
        doc: z.array(z.any()).optional(),
    }),
})

const replySupportZodSchema = z.object({
    body: z.object({
        reply: z.string({ required_error: 'Reply is required' }),
    }),
})
export const SupportValidations = {
    createSupportZodSchema,
    replySupportZodSchema
};

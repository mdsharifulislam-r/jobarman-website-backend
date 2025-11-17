import { z } from 'zod';
const createSupportZodSchema = z.object({
    body: z.object({
        reason: z.string({ required_error: 'Reason is required' }),
        description: z.string({ required_error: 'Description is required' }),
        image: z.array(z.any()).optional(),
        doc: z.array(z.any()).optional(),
    }),
})
export const SupportValidations = {
    createSupportZodSchema
};

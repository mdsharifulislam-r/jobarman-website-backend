import { z } from 'zod';

const createAdminZodSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Name is required' }),
        email: z.string({ required_error: 'Email is required' }),
        password: z.string({ required_error: 'Password is required' }),
        phone: z.string({ required_error: 'Phone is required' }),
        adminaccess:z.array(z.string()).min(1, { message: 'Admin Access is required' }),
    })
});


const createPriceForSpotlightZodSchema = z.object({
    body: z.object({
        price: z.number({ required_error: 'Price is required' }),
    })
});

export const AdminValidation = {
    createAdminZodSchema,
    createPriceForSpotlightZodSchema
};

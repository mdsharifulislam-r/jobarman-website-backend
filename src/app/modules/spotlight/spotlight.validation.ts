import { Types } from 'mongoose';
import { z } from 'zod';

const createSpotlightZodSchema = z.object({
    body: z.object({
        image: z.any(),
        organization_name: z.string().min(2, { message: 'Organization name must be at least 2 characters' }),
        service_type: z.string().min(2, { message: 'Service type must be at least 2 characters' }),
        focus_area: z.string().min(2, { message: 'Focus area must be at least 2 characters' }),
        mode: z.string().min(2, { message: 'Mode must be at least 2 characters' }),
        location: z.string().min(2, { message: 'Location must be at least 2 characters' }),
        pricing: z.string().min(2, { message: 'Pricing must be at least 2 characters' }),
        start_date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Start date must be a valid date' }).refine((startDate: string,) => {
            const now = new Date();
            const start = new Date(startDate);
            return start >= now;
        }, { message: 'start date must be geater than current date' }),
        end_date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'End date must be a valid date' }).refine((endDate: string) => {
            const now = new Date();
            const end = new Date(endDate);
            return end >= now;
        }, { message: 'End date must be greater than or equal to current date' }),
        start_time: z.string().min(2, { message: 'Start time must be at least 2 characters' }),
        end_time: z.string().min(2, { message: 'End time must be at least 2 characters' }),
        contact_info: z.string().min(2, { message: 'Contact info must be at least 2 characters' }),
    }),
})


const updateSpotlightZodSchema = z.object({
    params: z.object({
        id: z.string().refine((v) => Types.ObjectId.isValid(v), { message: 'Id must be a valid ObjectId' }),
    }),
    body: z.object({
        cover_image: z.string().optional(),
        organization_name: z.string().min(2, { message: 'Organization name must be at least 2 characters' }).optional(),
        service_type: z.string().min(2, { message: 'Service type must be at least 2 characters' }).optional(),
        focus_area: z.string().min(2, { message: 'Focus area must be at least 2 characters' }).optional(),
        mode: z.string().min(2, { message: 'Mode must be at least 2 characters' }).optional(),
        location: z.string().min(2, { message: 'Location must be at least 2 characters' }).optional(),
        pricing: z.string().min(2, { message: 'Pricing must be at least 2 characters' }).optional(),
        start_date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Start date must be a valid date' }).optional(),
        end_date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'End date must be a valid date' }).optional(),
        start_time: z.string().min(2, { message: 'Start time must be at least 2 characters' }).optional(),
        end_time: z.string().min(2, { message: 'End time must be at least 2 characters' }).optional(),
        contact_info: z.string().min(2, { message: 'Contact info must be at least 2 characters' }).optional(),
    }),
})

const approvedSpotlightZodSchema = z.object({
    params: z.object({
        id: z.string().refine((v) => Types.ObjectId.isValid(v), { message: 'Id must be a valid ObjectId' }),
    }),
    body: z.object({
        status: z.enum(['approved', 'rejected'], { message: 'Status must be either approved or rejected' }),
    }),
});

export const SpotlightValidations = {
    createSpotlightZodSchema,
    updateSpotlightZodSchema,
    approvedSpotlightZodSchema
};
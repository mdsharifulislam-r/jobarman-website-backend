import { z } from "zod";

const createDisclaimerZodSchema = z.object({
    body: z.object({
        content: z.string({
            required_error: 'Content is required'
        }),
        type: z.enum(['terms', 'privacy', 'about'], {
            required_error: 'Type is required'
        })
    })
})


export const DisclaimerValidation = {
    createDisclaimerZodSchema
}
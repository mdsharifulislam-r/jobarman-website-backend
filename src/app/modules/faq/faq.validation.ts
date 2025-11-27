import { z } from "zod";

const createFaqZodSchema = z.object({
    body: z.object({
        question: z.string({required_error:"Title is required"}).min(1),
        answer: z.string({required_error:"Description is required"}).min(1)
    })
})

const updateFaqZodSchema = z.object({
    body: z.object({
        question: z.string().optional(),
        answer: z.string().optional()
    })
}
)

export const FaqValidation = {
    createFaqZodSchema,
    updateFaqZodSchema,
}
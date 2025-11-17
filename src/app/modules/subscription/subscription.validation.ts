import { z } from "zod";

const createSubsciptionZodSchema = z.object({
  body: z.object({
    receipt: z.string({
      required_error: 'Receipt is required',
    }),
    userId: z.string({
      required_error: 'User id is required',
    }),
  }),
});




export const SubscriptionValidation = {
  createSubsciptionZodSchema,
};
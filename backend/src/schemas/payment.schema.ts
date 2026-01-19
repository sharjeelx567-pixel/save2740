import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
    amount: z.number().min(0.01, 'Amount must be greater than 0'),
    currency: z.string().length(3).optional(),
});

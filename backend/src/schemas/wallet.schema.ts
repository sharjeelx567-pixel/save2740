import { z } from 'zod';

export const depositSchema = z.object({
    amount: z.number().min(1, 'Amount must be at least $1').max(10000, 'Amount cannot exceed $10,000'),
    paymentMethodId: z.string().optional(),
    currency: z.string().length(3).default('usd').optional()
});

export const withdrawSchema = z.object({
    amount: z.number().min(10, 'Minimum withdrawal amount is $10').max(50000, 'Maximum withdrawal amount is $50,000'),
    paymentMethodId: z.string().min(1, 'Payment method ID is required'),
    reason: z.string().optional()
});

export const transactionQuerySchema = z.object({
    page: z.number().min(1).default(1).optional(),
    limit: z.number().min(1).max(100).default(50).optional(),
    type: z.enum(['deposit', 'withdraw', 'transfer', 'fee', 'refund', 'all']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional()
});

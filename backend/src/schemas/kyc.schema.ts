import { z } from 'zod';

// Custom validator for document paths (accepts both URLs and relative paths)
const documentPathSchema = z.string().min(1).refine((val) => {
    // Accept full URLs or relative paths starting with /
    return val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://');
}, 'Document must be a valid URL or path');

export const submitKycSchema = z.object({
    documentType: z.enum(['passport', 'drivers-license', 'national-id', 'utility-bill', 'bank-statement'], {
        errorMap: () => ({ message: 'Document type must be passport, drivers-license, national-id, utility-bill, or bank-statement' })
    }),
    documentNumber: z.string().min(1, 'Document number is required'),
    documentFront: documentPathSchema,
    documentBack: documentPathSchema.optional(),
    selfie: documentPathSchema,
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    dateOfBirth: z.string().refine((date) => {
        const birthDate = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        return age >= 18;
    }, 'You must be at least 18 years old'),
    address: z.object({
        street: z.string().min(1, 'Street address is required'),
        city: z.string().min(1, 'City is required'),
        state: z.string().min(1, 'State is required'),
        zipCode: z.string().min(1, 'Zip code is required'),
        country: z.string().min(1, 'Country is required'),
    }),
    ssn: z.string().optional().refine((val) => {
        if (!val) return true;
        // Basic SSN validation (US format: XXX-XX-XXXX)
        return /^\d{3}-?\d{2}-?\d{4}$/.test(val);
    }, 'Invalid SSN format'),
});

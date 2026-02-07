import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log('[Validate] Incoming body:', JSON.stringify(req.body, null, 2));
        schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            console.log('[Validate] Validation errors:', error.errors);
            return res.status(400).json({
                success: false,
                error: error.errors.map((e) => e.message).join('. '),
            });
        }
        next(error);
    }
};

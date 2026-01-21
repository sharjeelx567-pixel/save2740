import { Request, Response } from 'express';
import app from '../src/app';

// Vercel Serverless Function Config
export const config = {
    api: {
        bodyParser: false, // Let Express handle body parsing
    },
};

export default function handler(req: Request, res: Response) {
    return app(req, res);
}

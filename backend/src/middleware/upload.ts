
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
const kycDir = path.join(uploadDir, 'kyc');
const profilesDir = path.join(uploadDir, 'profiles');

[uploadDir, kycDir, profilesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure storage
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
        let dest = uploadDir;
        if (req.originalUrl.includes('kyc')) {
            dest = kycDir;
        } else if (req.originalUrl.includes('profile') || req.originalUrl.includes('avatar')) {
            dest = profilesDir;
        }
        cb(null, dest);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
        // Secure filename: userId-timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();

        // Assume req.userId is populated by auth middleware
        // If not, use 'guest'
        const userId = (req as any).userId || 'guest';

        cb(null, `${userId}-${uniqueSuffix}${ext}`);
    }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Allowed extensions
    const allowedTypes = /jpeg|jpg|png|pdf|webp/;
    // Normalize mimetype
    const mimeType = allowedTypes.test(file.mimetype);
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimeType && extName) {
        return cb(null, true);
    }

    cb(new Error('Only .png, .jpg, .jpeg, .webp and .pdf format allowed!'));
};

// Export multer instance
export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: fileFilter
});

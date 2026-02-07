
import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { submitKycSchema } from '../schemas/kyc.schema';
import { User } from '../models/auth.model';
import { KycDocument } from '../models/kyc-document';
import { connectDB } from '../config/db';
import { upload } from '../middleware/upload';
import { notifyAdminsKycSubmitted } from '../utils/notification-service';
import fs from 'fs';

const router = express.Router();

// GET /api/kyc/status
router.get('/status', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        const kycDoc = await KycDocument.findOne({ userId: req.userId }).sort({ createdAt: -1 });

        const documents: any = {};
        if (kycDoc) {
            if (kycDoc.frontImageUrl) documents.idFront = { uploadedAt: kycDoc.createdAt, status: kycDoc.status, url: kycDoc.frontImageUrl };
            if (kycDoc.backImageUrl) documents.idBack = { uploadedAt: kycDoc.createdAt, status: kycDoc.status, url: kycDoc.backImageUrl };
            if (kycDoc.selfieImageUrl) documents.selfie = { uploadedAt: kycDoc.createdAt, status: kycDoc.status, url: kycDoc.selfieImageUrl };
            // Note: Schema doesn't seem to have addressProofUrl explicitly, using metadata or assuming it might be handled differently. 
            // Looking at schema: documentType enum includes 'utility-bill', so frontImageUrl might BE the address proof?
            // But frontend treats addressProof separately. The schema might be limited. 
            // For now we map what we can.
        }

        res.json({
            success: true,
            data: {
                status: user.kycStatus || 'not_submitted',
                level: user.accountTier || 'basic',
                submittedAt: kycDoc?.createdAt,
                reviewedAt: kycDoc?.verifiedAt,
                rejectionReason: kycDoc?.rejectionReason,
                documents
            }
        });
    } catch (error) {
        console.error('KYC status error:', error);
        res.status(500).json({ success: false, error: 'Failed to get KYC status' });
    }
});

// POST /api/kyc/upload-id (Multipart)
router.post('/upload-id', authenticateToken, upload.fields([
    { name: 'idFront', maxCount: 1 },
    { name: 'idBack', maxCount: 1 }
]), async (req: AuthRequest, res: Response) => {
    try {
        // Files are in req.files
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        if (!files || (!files['idFront'] && !files['idBack'])) {
            return res.status(400).json({ success: false, error: 'At least one ID image is required' });
        }

        const responseData: any = {};

        if (files['idFront']) {
            responseData.frontUrl = `/uploads/kyc/${files['idFront'][0].filename}`;
        }

        if (files['idBack']) {
            responseData.backUrl = `/uploads/kyc/${files['idBack'][0].filename}`;
        }

        res.json({
            success: true,
            message: 'ID documents uploaded',
            data: responseData
        });

    } catch (error) {
        console.error('Upload ID error:', error);
        res.status(500).json({ success: false, error: 'Upload failed' });
    }
});

// POST /api/kyc/selfie
router.post('/selfie', authenticateToken, upload.single('selfie'), async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Selfie image is required' });
        }

        const selfieUrl = `/uploads/kyc/${req.file.filename}`;

        res.json({
            success: true,
            data: { selfieUrl }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Upload failed' });
    }
});

// POST /api/kyc/address
router.post('/address', authenticateToken, upload.single('document'), async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Address document is required' });
        }
        const addressUrl = `/uploads/kyc/${req.file.filename}`;
        res.json({ success: true, data: { addressUrl } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Upload failed' });
    }
});

// POST /api/kyc/submit - Final Submission
router.post('/submit', authenticateToken, validate(submitKycSchema), async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const {
            documentType,
            documentNumber,
            documentFront,
            documentBack,
            selfie,
            firstName,
            lastName,
            dateOfBirth,
            address,
            ssn
        } = req.body;

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        if (user.kycStatus === 'approved') {
            return res.status(400).json({ success: false, error: 'Already verified' });
        }

        // Create Verification Record
        console.log('[KYC Submit] Creating document for user:', req.userId);
        console.log('[KYC Submit] Payload:', {
            documentType,
            documentNumber,
            frontImageUrl: documentFront,
            status: 'pending'
        });

        const newDoc = await KycDocument.create({
            userId: req.userId,
            documentType,
            documentNumber,
            frontImageUrl: documentFront,
            backImageUrl: documentBack,
            selfieImageUrl: selfie,
            status: 'pending',
            metadata: {
                firstName,
                lastName,
                dateOfBirth: new Date(dateOfBirth)
            }
        });
        console.log('[KYC Submit] Document created successfully:', newDoc._id);

        // Update User
        user.kycStatus = 'pending';
        await user.save();

        // Notify admins of new KYC submission
        const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
        notifyAdminsKycSubmitted(req.userId!, userName, user.email).catch(() => {});

        res.json({
            success: true,
            message: 'KYC Application Submitted'
        });

    } catch (error) {
        console.error('KYC Submit error:', error);
        res.status(500).json({ success: false, error: 'Submission failed' });
    }
});

export default router;

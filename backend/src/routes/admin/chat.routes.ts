import express, { Response } from 'express';
import { authenticateToken, authenticateAdmin, AuthRequest } from '../../middleware/auth';
import { User } from '../../models/auth.model';
import { KycDocument } from '../../models/kyc-document';
import { ChatLog } from '../../models/chat-log.model';
import { connectDB } from '../../config/db';

const router = express.Router();

// POST /api/admin/chat/log - Log chat message for audit
router.post('/log', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { userId, adminId, message, senderType, sessionId } = req.body;

        if (!userId || !message || !senderType) {
            return res.status(400).json({ 
                success: false, 
                error: 'userId, message, and senderType are required' 
            });
        }

        const user = await User.findById(userId).select('email kycStatus');
        const admin = adminId ? await User.findById(adminId).select('email') : null;

        await ChatLog.create({
            userId,
            adminId,
            message,
            senderType,
            timestamp: new Date(),
            metadata: {
                userEmail: user?.email,
                adminEmail: admin?.email,
                userKycStatus: user?.kycStatus,
                sessionId,
            }
        });

        res.json({
            success: true,
            message: 'Chat logged successfully'
        });
    } catch (error) {
        console.error('Chat log error:', error);
        res.status(500).json({ success: false, error: 'Failed to log chat' });
    }
});

// GET /api/admin/chat/users - Get list of users with active chats
router.get('/users', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();

        // Get unique users from chat logs (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const chatUsers = await ChatLog.aggregate([
            { $match: { timestamp: { $gte: thirtyDaysAgo } } },
            { $sort: { timestamp: -1 } },
            { $group: {
                _id: '$userId',
                lastMessage: { $first: '$message' },
                lastTimestamp: { $first: '$timestamp' },
                messageCount: { $sum: 1 }
            }},
            { $sort: { lastTimestamp: -1 } },
            { $limit: 100 }
        ]);

        // Get user details (include profileImage so admin chat shows same picture/name as website)
        const userIds = chatUsers.map(c => c._id);
        const users = await User.find({ _id: { $in: userIds } })
            .select('email firstName lastName profileImage kycStatus accountStatus');

        const usersWithChats = chatUsers.map(chat => {
            const user = users.find(u => u._id.toString() === chat._id);
            return {
                userId: chat._id,
                email: user?.email,
                firstName: user?.firstName,
                lastName: user?.lastName,
                profileImage: user?.profileImage ?? null,
                kycStatus: user?.kycStatus,
                accountStatus: user?.accountStatus,
                lastMessage: chat.lastMessage,
                lastTimestamp: chat.lastTimestamp,
                messageCount: chat.messageCount
            };
        });

        res.json({
            success: true,
            data: usersWithChats
        });
    } catch (error) {
        console.error('Get chat users error:', error);
        res.status(500).json({ success: false, error: 'Failed to get chat users' });
    }
});

// GET /api/admin/chat/:userId/profile - Get user profile with KYC for chat context
router.get('/:userId/profile', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { userId } = req.params;

        const user = await User.findById(userId).select('-password -passwordHash');
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        const kycDoc = await KycDocument.findOne({ userId }).sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    profileImage: user.profileImage,
                    kycStatus: user.kycStatus,
                    accountStatus: user.accountStatus,
                    emailVerified: user.emailVerified,
                    phoneNumber: user.phoneNumber,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin,
                },
                kyc: kycDoc ? {
                    id: kycDoc._id,
                    status: kycDoc.status,
                    submittedAt: kycDoc.createdAt,
                    reviewedAt: kycDoc.verifiedAt,
                    rejectionReason: kycDoc.rejectionReason,
                } : null
            }
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ success: false, error: 'Failed to get user profile' });
    }
});

// GET /api/admin/chat/:userId/history - Get chat history (from database audit logs)
router.get('/:userId/history', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { userId } = req.params;
        const { limit = 100, before } = req.query;

        const query: any = { userId };
        if (before) {
            query.timestamp = { $lt: new Date(before as string) };
        }

        const messages = await ChatLog.find(query)
            .sort({ timestamp: -1 })
            .limit(Number(limit));

        res.json({
            success: true,
            data: messages.reverse() // Return chronological order
        });
    } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({ success: false, error: 'Failed to get chat history' });
    }
});

export default router;

import express, { Response } from 'express';
import { authenticateAdmin, AuthRequest } from '../../middleware/auth';
import Notification from '../../models/Notification';
import { User } from '../../models/auth.model';
import { connectDB } from '../../config/db';

const router = express.Router();

/**
 * @route   GET /api/admin/notifications/feed
 * @desc    Get current admin's notification feed (KYC, payments, chat, etc.)
 * @access  Admin
 */
router.get('/feed', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const adminId = req.userId;
        if (!adminId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const { page = 1, limit = 30 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const notifications = await Notification.find({ userId: adminId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        const total = await Notification.countDocuments({ userId: adminId });
        const unreadCount = await Notification.countDocuments({ userId: adminId, read: false });
        const unseenChatCount = await Notification.countDocuments({
            userId: adminId,
            type: 'chat_message',
            read: false
        });

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount,
                unseenChatCount,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get admin notification feed error:', error);
        res.status(500).json({ success: false, error: 'Failed to get feed' });
    }
});

/**
 * @route   PUT /api/admin/notifications/:id/read
 * @desc    Mark a notification as read (only own notifications)
 * @access  Admin
 */
router.put('/:id/read', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const adminId = req.userId;
        const { id } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId: adminId },
            { read: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, error: 'Notification not found' });
        }

        res.json({ success: true, data: notification });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ success: false, error: 'Failed to mark as read' });
    }
});

/**
 * @route   POST /api/admin/notifications/mark-all-read
 * @desc    Mark all current admin's notifications as read
 * @access  Admin
 */
router.post('/mark-all-read', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const adminId = req.userId;

        await Notification.updateMany(
            { userId: adminId, read: false },
            { read: true, readAt: new Date() }
        );

        res.json({ success: true, message: 'All marked as read' });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ success: false, error: 'Failed to mark all as read' });
    }
});

/**
 * @route   POST /api/admin/notifications/send
 * @desc    Send a notification to users
 * @access  Admin
 */
router.post('/send', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { targetAudience, userId, title, message, type = 'info' } = req.body;

        if (!title || !message) {
            return res.status(400).json({ success: false, error: 'Title and message are required' });
        }

        let recipients: any[] = [];

        // Determine recipients
        if (targetAudience === 'specific_user' && userId) {
            const user = await User.findById(userId);
            if (user) recipients.push(user);
        } else if (targetAudience === 'all_users') {
            recipients = await User.find({}).select('_id');
        } else if (targetAudience === 'active_users') {
            recipients = await User.find({ accountStatus: 'active' }).select('_id');
        } else if (targetAudience === 'pending_kyc') {
            recipients = await User.find({ kycStatus: 'pending' }).select('_id');
        }

        if (recipients.length === 0) {
            return res.status(404).json({ success: false, error: 'No recipients found' });
        }

        // Create notifications in bulk
        const notifications = recipients.map(user => ({
            userId: user._id.toString(),
            title,
            message,
            type,
            read: false,
            createdAt: new Date(),
            channels: { // Default channels
                email: false,
                push: true,
                sms: false
            },
            relatedData: {
                adminId: req.userId
            }
        }));

        await Notification.insertMany(notifications);

        res.json({
            success: true,
            message: `Notification sent to ${recipients.length} users`,
            count: recipients.length
        });

    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ success: false, error: 'Failed to send notification' });
    }
});

/**
 * @route   GET /api/admin/notifications/history
 * @desc    Get history of all notifications in the system
 * @access  Admin
 */
router.get('/history', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        // Fetch ALL notifications (including chat, system, info, etc.)
        const notifications = await Notification.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(); // Use lean() to allow adding properties

        const total = await Notification.countDocuments({});

        // Enrich with User Details
        // 1. Get unique user IDs
        const userIds = [...new Set(notifications.map(n => n.userId))];

        // 2. Fetch users
        const users = await User.find({ _id: { $in: userIds } }).select('firstName lastName email');

        // 3. Create map for quick lookup
        const userMap = new Map(users.map(u => [u._id.toString(), u]));

        // 4. Attach user info
        const notificationsWithUser = notifications.map(n => {
            const user = userMap.get(n.userId);
            return {
                ...n,
                recipientName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
                recipientEmail: user ? user.email : 'N/A'
            };
        });

        res.json({
            success: true,
            data: {
                notifications: notificationsWithUser,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });

    } catch (error) {
        console.error('Get notification history error:', error);
        res.status(500).json({ success: false, error: 'Failed to get history' });
    }
});

export default router;

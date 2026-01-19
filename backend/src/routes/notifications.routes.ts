import express, { Response } from 'express';
// We'll use a simple placeholder model logic since Notification model might not exist or needs defining
// If you have a Notification model, import it here. For now I'll check if file exists or simulate it.
import mongoose, { Schema } from 'mongoose';
import { connectDB } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Define schema inline if not found elsewhere (quick implementation pattern)
/**
 * Quick inline Notification Schema/Model for backend api completeness
 */
const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['system', 'alert', 'info', 'success', 'warning'], default: 'info' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Get or create model safely
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);


// GET /api/notifications - Get all notifications
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20);

    // Check unread count
    const unreadCount = await Notification.countDocuments({
      userId: req.userId,
      read: false
    });

    res.json({
      success: true,
      data: {
        items: notifications,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications'
    });
  }
});

// PUT /api/notifications/:id/read - Mark as read
router.put('/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    // Update specific or all if id is 'all'
    if (req.params.id === 'all') {
      await Notification.updateMany(
        { userId: req.userId, read: false },
        { $set: { read: true } }
      );
      return res.json({ success: true, message: 'All marked as read' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification'
    });
  }
});

export default router;

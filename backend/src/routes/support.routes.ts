import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { SupportTicket } from '../models/support-ticket.model';
import { User } from '../models/auth.model';
import { connectDB } from '../config/db';
import Notification from '../models/Notification';

const router = express.Router();

// Helper to generate ticket number
const generateTicketNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `TKT-${timestamp}-${random}`;
};

// POST /api/support/ticket - Create a new support ticket
router.post('/ticket', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { subject, category, message, priority = 'medium' } = req.body;
    const userId = req.user!.userId;

    if (!subject || !category || !message) {
      return res.status(400).json({ success: false, error: 'Subject, category, and message are required' });
    }

    const user = await User.findById(userId);

    const ticket = await SupportTicket.create({
      ticketNumber: generateTicketNumber(),
      userId,
      subject,
      category,
      priority,
      status: 'open',
      messages: [{
        senderId: userId,
        senderType: 'user',
        message,
        timestamp: new Date()
      }]
    });

    // Notify Admins
    // Find admins
    const admins = await User.find({ role: 'admin', accountStatus: 'active' }).select('_id');

    // Create notification for admins
    if (admins.length > 0) {
      const adminNotifications = admins.map(admin => ({
        userId: admin._id,
        type: 'info', // or 'system'
        title: 'New Support Ticket',
        message: `New ticket from ${user?.firstName || 'User'}: ${subject}`,
        relatedData: {
          ticketId: ticket._id.toString(),
          userId: userId
        },
        read: false
      }));

      await Notification.insertMany(adminNotifications);
    }

    res.status(201).json({
      success: true,
      message: 'Support ticket created',
      data: ticket
    });

  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ success: false, error: 'Failed to create ticket' });
  }
});

// GET /api/support/tickets - List user's tickets
router.get('/tickets', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const userId = req.user!.userId;
    const { page = 1, limit = 20, status } = req.query;

    const query: any = { userId };
    if (status && status !== 'all') query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const tickets = await SupportTicket.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await SupportTicket.countDocuments(query);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({ success: false, error: 'Failed to get tickets' });
  }
});

// GET /api/support/ticket/:ticketId - Get ticket details
router.get('/ticket/:ticketId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { ticketId } = req.params;
    const userId = req.user!.userId;

    const ticket = await SupportTicket.findOne({ _id: ticketId, userId });

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    res.json({
      success: true,
      data: ticket
    });

  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ success: false, error: 'Failed to get ticket' });
  }
});

// POST /api/support/ticket/:ticketId/reply - Reply to ticket
router.post('/ticket/:ticketId/reply', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { ticketId } = req.params;
    const { message } = req.body;
    const userId = req.user!.userId;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const ticket = await SupportTicket.findOne({ _id: ticketId, userId });

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    ticket.messages.push({
      senderId: userId,
      senderType: 'user',
      message,
      timestamp: new Date()
    });

    // Update status if it was waiting for user or resolved
    if (ticket.status === 'waiting-user' || ticket.status === 'resolved') {
      ticket.status = 'in-progress'; // Re-open/Active
    }

    await ticket.save();

    // Notify Assigned Admin 
    if (ticket.assignedTo) {
      await Notification.create({
        userId: ticket.assignedTo,
        type: 'info',
        title: 'Ticket Reply',
        message: `User replied to ticket #${ticket.ticketNumber}`,
        relatedData: {
          ticketId: ticket._id.toString()
        }
      });
    }

    res.json({
      success: true,
      message: 'Reply sent',
      data: ticket
    });

  } catch (error) {
    console.error('Reply ticket error:', error);
    res.status(500).json({ success: false, error: 'Failed to reply' });
  }
});

export default router;

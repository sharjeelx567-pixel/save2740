import express, { Response } from 'express';
import { authenticateAdmin, AuthRequest } from '../../middleware/auth';
import { SupportTicket } from '../../models/support-ticket.model';
import { User } from '../../models/auth.model';
import Notification from '../../models/Notification';
import { connectDB } from '../../config/db';

const router = express.Router();

// GET /api/admin/support-tickets - List all support tickets
router.get('/', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const {
            page = 1,
            limit = 20,
            status,
            priority,
            category,
            assignedTo
        } = req.query;

        const query: any = {};
        if (status && status !== 'all') query.status = status;
        if (priority && priority !== 'all') query.priority = priority;
        if (category && category !== 'all') query.category = category;
        if (assignedTo && assignedTo !== 'all') query.assignedTo = assignedTo;

        const skip = (Number(page) - 1) * Number(limit);

        const [tickets, total] = await Promise.all([
            SupportTicket.find(query)
                .sort({ priority: 1, createdAt: -1 }) // urgent first, then newest
                .skip(skip)
                .limit(Number(limit)),
            SupportTicket.countDocuments(query)
        ]);

        // Get user details for each ticket
        const ticketsWithUsers = await Promise.all(
            tickets.map(async (ticket) => {
                const user = await User.findById(ticket.userId).select('email firstName lastName');
                const assignedAdmin = ticket.assignedTo
                    ? await User.findById(ticket.assignedTo).select('email firstName lastName')
                    : null;

                return {
                    ...ticket.toObject(),
                    user: user ? {
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName
                    } : null,
                    assignedAdmin: assignedAdmin ? {
                        email: assignedAdmin.email,
                        firstName: assignedAdmin.firstName,
                        lastName: assignedAdmin.lastName
                    } : null
                };
            })
        );

        res.json({
            success: true,
            data: {
                tickets: ticketsWithUsers,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get support tickets error:', error);
        res.status(500).json({ success: false, error: 'Failed to get support tickets' });
    }
});

// GET /api/admin/support-tickets/stats - Get ticket statistics
router.get('/stats', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();

        const [open, inProgress, resolved, urgent] = await Promise.all([
            SupportTicket.countDocuments({ status: 'open' }),
            SupportTicket.countDocuments({ status: 'in-progress' }),
            SupportTicket.countDocuments({ status: 'resolved' }),
            SupportTicket.countDocuments({ priority: 'urgent', status: { $in: ['open', 'in-progress'] } })
        ]);

        res.json({
            success: true,
            data: {
                open,
                inProgress,
                resolved,
                urgent,
                total: open + inProgress + resolved
            }
        });
    } catch (error) {
        console.error('Get ticket stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to get stats' });
    }
});

// GET /api/admin/support-tickets/:ticketId - Get ticket details
router.get('/:ticketId', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { ticketId } = req.params;

        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ success: false, error: 'Ticket not found' });
        }

        const user = await User.findById(ticket.userId).select('-passwordHash');
        const assignedAdmin = ticket.assignedTo
            ? await User.findById(ticket.assignedTo).select('email firstName lastName')
            : null;

        res.json({
            success: true,
            data: {
                ticket: ticket.toObject(),
                user,
                assignedAdmin
            }
        });
    } catch (error) {
        console.error('Get ticket error:', error);
        res.status(500).json({ success: false, error: 'Failed to get ticket' });
    }
});

// POST /api/admin/support-tickets/:ticketId/reply - Reply to ticket
router.post('/:ticketId/reply', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { ticketId } = req.params;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }

        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ success: false, error: 'Ticket not found' });
        }

        ticket.messages.push({
            senderId: req.userId!,
            senderType: 'admin',
            message,
            timestamp: new Date()
        });

        // Auto-assign if not assigned
        if (!ticket.assignedTo) {
            ticket.assignedTo = req.userId;
        }

        // Change status to in-progress if open
        if (ticket.status === 'open') {
            ticket.status = 'in-progress';
        }

        await ticket.save();

        // Notify user about admin reply
        await Notification.create({
            userId: ticket.userId,
            type: 'support_reply',
            title: 'Support Ticket Update',
            message: `Admin replied to ticket #${ticket.ticketNumber}`,
            relatedData: {
                ticketId: ticket._id.toString(),
                adminId: req.userId
            }
        });

        res.json({
            success: true,
            message: 'Reply sent successfully',
            data: ticket
        });
    } catch (error) {
        console.error('Reply to ticket error:', error);
        res.status(500).json({ success: false, error: 'Failed to reply' });
    }
});

// PATCH /api/admin/support-tickets/:ticketId/assign - Assign ticket to admin
router.patch('/:ticketId/assign', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { ticketId } = req.params;
        const { adminId } = req.body;

        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ success: false, error: 'Ticket not found' });
        }

        ticket.assignedTo = adminId || req.userId;
        if (ticket.status === 'open') {
            ticket.status = 'in-progress';
        }

        await ticket.save();

        res.json({
            success: true,
            message: 'Ticket assigned successfully',
            data: ticket
        });
    } catch (error) {
        console.error('Assign ticket error:', error);
        res.status(500).json({ success: false, error: 'Failed to assign ticket' });
    }
});

// PATCH /api/admin/support-tickets/:ticketId/status - Update ticket status
router.patch('/:ticketId/status', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { ticketId } = req.params;
        const { status, resolutionNotes } = req.body;

        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ success: false, error: 'Ticket not found' });
        }

        ticket.status = status;

        if (status === 'resolved' || status === 'closed') {
            ticket.resolvedAt = new Date();
            ticket.resolvedBy = req.userId;
            if (resolutionNotes) {
                ticket.resolutionNotes = resolutionNotes;
            }
        }

        await ticket.save();

        res.json({
            success: true,
            message: 'Ticket status updated successfully',
            data: ticket
        });
    } catch (error) {
        console.error('Update ticket status error:', error);
        res.status(500).json({ success: false, error: 'Failed to update status' });
    }
});

// PATCH /api/admin/support-tickets/:ticketId/priority - Update ticket priority
router.patch('/:ticketId/priority', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { ticketId } = req.params;
        const { priority } = req.body;

        if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
            return res.status(400).json({ success: false, error: 'Invalid priority' });
        }

        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ success: false, error: 'Ticket not found' });
        }

        ticket.priority = priority;
        await ticket.save();

        res.json({
            success: true,
            message: 'Ticket priority updated successfully',
            data: ticket
        });
    } catch (error) {
        console.error('Update ticket priority error:', error);
        res.status(500).json({ success: false, error: 'Failed to update priority' });
    }
});

export default router;

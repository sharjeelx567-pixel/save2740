
import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { User, Session } from '../models/auth.model';
import { PaymentMethod } from '../models/payment-method.model';
import { connectDB } from '../config/db';
import { auditLog } from '../middleware/security';

const router = express.Router();

// GET /api/account/linked-accounts
router.get('/linked-accounts', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    // 1. Get Payment Methods
    const paymentMethods = await PaymentMethod.find({
      userId: req.userId,
      isActive: true
    }).select('type last4 brand isDefault');

    // 2. Get Active Sessions (Devices)
    const sessions = await Session.find({
      userId: req.userId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).select('userAgent ipAddress lastActive createdAt');

    // 3. Get User for Social Logins (if implemented)
    const user = await User.findById(req.userId);

    res.json({
      success: true,
      data: {
        paymentMethods,
        sessions,
        email: user?.email,
        hasPassword: !!user?.passwordHash,
        // Add Google/Apple/Facebook if you store them in user.socialAccounts
      }
    });

  } catch (error) {
    console.error('Linked accounts error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch linked accounts' });
  }
});

// POST /api/account/close (Soft Delete)
router.post('/close', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { reason, feedback } = req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (user.accountStatus !== 'active') {
      return res.status(400).json({ success: false, error: 'Account is not active' });
    }

    // Logic: Mark suspended/closed
    user.accountStatus = 'suspended'; // Or add 'closed' enum if you update model
    // We track the metadata in an audit log later, or a 'ClosureRequest' model

    await user.save();

    // Invalidate all sessions
    await Session.updateMany(
      { userId: req.userId, isActive: true },
      { isActive: false, revokedAt: new Date() }
    );

    res.json({
      success: true,
      message: 'Account closed successfully. You have been logged out.'
    });

  } catch (error) {
    console.error('Close account error:', error);
    res.status(500).json({ success: false, error: 'Failed to close account' });
  }
});

// DELETE /api/account (Hard Delete - with Password Confirmation)
router.delete('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { password, confirm } = req.body;

    if (!confirm) {
      return res.status(400).json({ success: false, error: 'Please confirm deletion' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Verify password is required for security
    if (!user.passwordHash) {
      // Handle social-only users differently if needed
      // For now, assume password exists
      return res.status(400).json({ success: false, error: 'Password not set' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Incorrect password' });
    }

    // --- EXECUTE DELETION ---
    // 1. Delete User
    await User.findByIdAndDelete(req.userId);

    // 2. Delete Sessions
    await Session.deleteMany({ userId: req.userId });

    // 3. Anonymize/Delete PII in other collections?
    // E.g. Anonymize Transactions? Keep them for audit but nullify userId? 
    // For simplicity/compliance, keeping financial records is usually required.
    // We will just keep them linked to the (now deleted) ID or move to archive.

    res.json({
      success: true,
      message: 'Account permanently deleted.'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete account' });
  }
});

export default router;

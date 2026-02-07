import express, { Response } from 'express';
// Inline Schema for Saver Pockets
import mongoose, { Schema } from 'mongoose';
import { connectDB } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { Wallet } from '../models/wallet.model';

const router = express.Router();

// Define schema inline safely
const PocketSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  icon: { type: String }, // For UI icon/emoji
  color: { type: String }, // For UI color
  deadline: { type: Date },
  dailyAmount: { type: Number, default: 0 },
  multiplier: { type: Number, default: 1 },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
}, { timestamps: true });

const Pocket = mongoose.models.Pocket || mongoose.model('Pocket', PocketSchema);

// GET /api/saver-pockets - List all pockets
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const pockets = await Pocket.find({ userId: req.userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pockets
    });

  } catch (error) {
    console.error('List pockets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list pockets'
    });
  }
});

// POST /api/saver-pockets - Create pocket
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const { name, targetAmount, deadline, icon, color, dailyAmount, multiplier } = req.body;

    if (!name || !targetAmount) {
      return res.status(400).json({ error: 'Name and target amount required' });
    }

    const pocket = await Pocket.create({
      userId: req.userId as any,
      name,
      targetAmount,
      deadline,
      icon,
      color,
      dailyAmount: dailyAmount || 0,
      multiplier: multiplier || 1
    });

    res.status(201).json({
      success: true,
      data: pocket
    });

  } catch (error) {
    console.error('Create pocket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create pocket'
    });
  }
});

// POST /api/saver-pockets/:id/fund - Add funds to pocket from wallet
router.post('/:id/fund', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    const pocket = await Pocket.findOne({ _id: req.params.id, userId: req.userId });
    if (!pocket) return res.status(404).json({ error: 'Pocket not found' });

    const wallet = await Wallet.findOne({ userId: req.userId });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    if (wallet.availableBalance < amount) {
      return res.status(400).json({ error: 'Insufficient available balance in wallet' });
    }

    // Transfer logic
    wallet.availableBalance -= amount;
    // Note: total balance stays same, but available decreases
    // lockedInPockets increases
    wallet.lockedInPockets = (wallet.lockedInPockets || 0) + amount;

    pocket.currentAmount += amount;

    // Check completion
    if (pocket.currentAmount >= pocket.targetAmount) {
      pocket.status = 'completed';
      // logic for completion notification could go here
    }

    await wallet.save();
    await pocket.save();

    res.json({
      success: true,
      data: {
        pocket,
        walletBalance: wallet.availableBalance
      }
    });

  } catch (error) {
    console.error('Fund pocket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fund pocket'
    });
  }
});

// DELETE /api/saver-pockets/:id - Delete/Withdraw pocket
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const pocket = await Pocket.findOne({ _id: req.params.id, userId: req.userId });
    if (!pocket) return res.status(404).json({ error: 'Pocket not found' });

    // Return funds to wallet if any
    if (pocket.currentAmount > 0) {
      const wallet = await Wallet.findOne({ userId: req.userId });
      if (wallet) {
        wallet.availableBalance += pocket.currentAmount;
        wallet.lockedInPockets = Math.max(0, (wallet.lockedInPockets || 0) - pocket.currentAmount);
        await wallet.save();
      }
    }

    await Pocket.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: 'Pocket deleted and funds returned to wallet'
    });

  } catch (error) {
    console.error('Delete pocket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete pocket'
    });
  }
});


// PUT /api/saver-pockets/:id - Update pocket
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { name, targetAmount, deadline, icon, color, dailyAmount, multiplier } = req.body;

    // Explicitly cast req.params.id to string to avoid type issues if needed, but it's usually string
    const pocket = await Pocket.findOne({ _id: req.params.id, userId: req.userId });
    if (!pocket) return res.status(404).json({ error: 'Pocket not found' });

    if (name) pocket.name = name;
    if (targetAmount) pocket.targetAmount = targetAmount;
    if (deadline) pocket.deadline = deadline;
    if (icon) pocket.icon = icon;
    if (color) pocket.color = color;
    if (dailyAmount !== undefined) pocket.dailyAmount = dailyAmount;
    if (multiplier !== undefined) pocket.multiplier = multiplier;

    await pocket.save();

    res.json({ success: true, data: pocket });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update pocket' });
  }
});

export default router;

import express, { Response } from 'express';
import { connectDB } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { Transaction } from '../models/transaction.model';

const router = express.Router();

// GET /api/transactions - Get all transactions with filtering
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const {
      type,
      status,
      startDate,
      endDate,
      page = '1',
      limit = '50'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { userId: req.userId };

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate as string);
      }
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      data: {
        transactions,
        total,
        page: pageNum,
        pageSize: limitNum,
        hasMore: skip + transactions.length < total
      }
    });
  } catch (error: any) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get transactions'
    });
  }
});

// GET /api/transactions/:id - Get transaction detail
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error: any) {
    console.error('Get transaction detail error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get transaction'
    });
  }
});

// GET /api/transactions/export/csv - Export transactions as CSV
router.get('/export/csv', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const {
      type,
      status,
      startDate,
      endDate
    } = req.query;

    const filter: any = { userId: req.userId };

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate as string);
      }
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(10000); // Max 10k for export

    // Generate CSV
    const headers = ['Date', 'Transaction ID', 'Type', 'Amount', 'Status', 'Description'];
    const rows = transactions.map(t => [
      t.createdAt.toISOString(),
      t.transactionId,
      t.type,
      t.amount.toFixed(2),
      t.status,
      t.description || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error: any) {
    console.error('Export CSV error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export transactions'
    });
  }
});

// GET /api/transactions/statement/annual - Get annual statement
router.get('/statement/annual', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { year } = req.query;

    const yearNum = year ? parseInt(year as string) : new Date().getFullYear();
    const startDate = new Date(yearNum, 0, 1);
    const endDate = new Date(yearNum, 11, 31, 23, 59, 59);

    const transactions = await Transaction.find({
      userId: req.userId,
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'completed'
    }).sort({ createdAt: 1 });

    // Calculate summary
    const deposits = transactions
      .filter(t => ['deposit', 'save_daily', 'goal_fund'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    const withdrawals = transactions
      .filter(t => ['withdraw', 'withdrawal'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    const fees = transactions
      .filter(t => t.type === 'fee')
      .reduce((sum, t) => sum + t.amount, 0);

    const bonuses = transactions
      .filter(t => t.type === 'referral_bonus')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      data: {
        year: yearNum,
        startDate,
        endDate,
        summary: {
          totalDeposits: deposits,
          totalWithdrawals: withdrawals,
          totalFees: fees,
          totalBonuses: bonuses,
          netAmount: deposits - withdrawals - fees + bonuses,
        },
        transactions: transactions.map(t => ({
          id: t._id,
          transactionId: t.transactionId,
          date: t.createdAt,
          type: t.type,
          amount: t.amount,
          description: t.description,
          status: t.status,
        }))
      }
    });
  } catch (error: any) {
    console.error('Get annual statement error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get annual statement'
    });
  }
});

// GET /api/transactions/tax-summary - Get tax summary (future-proof)
router.get('/tax-summary', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { year } = req.query;

    const yearNum = year ? parseInt(year as string) : new Date().getFullYear();
    const startDate = new Date(yearNum, 0, 1);
    const endDate = new Date(yearNum, 11, 31, 23, 59, 59);

    const transactions = await Transaction.find({
      userId: req.userId,
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'completed'
    });

    // Calculate taxable income (bonuses, interest, etc.)
    const taxableIncome = transactions
      .filter(t => ['referral_bonus'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate deductible expenses (fees)
    const deductibleExpenses = transactions
      .filter(t => t.type === 'fee')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      data: {
        year: yearNum,
        taxableIncome,
        deductibleExpenses,
        netTaxableIncome: taxableIncome - deductibleExpenses,
        note: 'This is a preliminary summary. Consult a tax professional for accurate tax filing.',
      }
    });
  } catch (error: any) {
    console.error('Get tax summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get tax summary'
    });
  }
});

export default router;

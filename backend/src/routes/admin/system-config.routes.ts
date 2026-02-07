import express, { Response } from 'express';
import { authenticateAdmin, AuthRequest } from '../../middleware/auth';
import { SystemConfig } from '../../models/system-config.model';
import { connectDB } from '../../config/db';

const router = express.Router();

// GET /api/admin/system-config - Get all system configurations
router.get('/', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { category } = req.query;

        const query: any = {};
        if (category && category !== 'all') query.category = category;

        const configs = await SystemConfig.find(query).sort({ category: 1, key: 1 });

        res.json({
            success: true,
            data: configs
        });
    } catch (error) {
        console.error('Get system config error:', error);
        res.status(500).json({ success: false, error: 'Failed to get system config' });
    }
});

// GET /api/admin/system-config/:key - Get specific config by key
router.get('/:key', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { key } = req.params;

        const config = await SystemConfig.findOne({ key });
        if (!config) {
            return res.status(404).json({ success: false, error: 'Config not found' });
        }

        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Get config error:', error);
        res.status(500).json({ success: false, error: 'Failed to get config' });
    }
});

// POST /api/admin/system-config - Create new config
router.post('/', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { key, value, type, category, description } = req.body;

        if (!key || !value || !type || !category || !description) {
            return res.status(400).json({ 
                success: false, 
                error: 'Key, value, type, category, and description are required' 
            });
        }

        // Check if config already exists
        const existing = await SystemConfig.findOne({ key });
        if (existing) {
            return res.status(400).json({ 
                success: false, 
                error: 'Config with this key already exists' 
            });
        }

        const config = await SystemConfig.create({
            key,
            value,
            type,
            category,
            description,
            updatedBy: req.userId
        });

        res.json({
            success: true,
            message: 'Config created successfully',
            data: config
        });
    } catch (error) {
        console.error('Create config error:', error);
        res.status(500).json({ success: false, error: 'Failed to create config' });
    }
});

// PUT /api/admin/system-config/:key - Update config
router.put('/:key', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { key } = req.params;
        const { value, description } = req.body;

        const config = await SystemConfig.findOne({ key });
        if (!config) {
            return res.status(404).json({ success: false, error: 'Config not found' });
        }

        if (value !== undefined) config.value = value;
        if (description) config.description = description;
        config.updatedBy = req.userId!;

        await config.save();

        res.json({
            success: true,
            message: 'Config updated successfully',
            data: config
        });
    } catch (error) {
        console.error('Update config error:', error);
        res.status(500).json({ success: false, error: 'Failed to update config' });
    }
});

// DELETE /api/admin/system-config/:key - Delete config
router.delete('/:key', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { key } = req.params;

        const config = await SystemConfig.findOneAndDelete({ key });
        if (!config) {
            return res.status(404).json({ success: false, error: 'Config not found' });
        }

        res.json({
            success: true,
            message: 'Config deleted successfully'
        });
    } catch (error) {
        console.error('Delete config error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete config' });
    }
});

// GET /api/admin/system-config/categories/list - Get all categories
router.get('/categories/list', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();

        const categories = await SystemConfig.distinct('category');

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ success: false, error: 'Failed to get categories' });
    }
});

export default router;

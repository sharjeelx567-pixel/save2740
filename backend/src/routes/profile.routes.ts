import express, { Response } from 'express';
import { User } from '../models/auth.model';
import { connectDB } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/profile - Get user profile
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();

        const user = await User.findById(req.userId).select('-passwordHash');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get profile'
        });
    }
});

// PUT /api/profile - Update user profile
router.put('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();

        const { firstName, lastName, phoneNumber, profileImage } = req.body;

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Update fields
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (profileImage) user.profileImage = profileImage;

        await user.save();

        // Return updated user without password
        const updatedUser = await User.findById(req.userId).select('-passwordHash');

        res.json({
            success: true,
            data: updatedUser
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update profile'
        });
    }
});

// PUT /api/profile/avatar - Update profile picture
router.put('/avatar', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { avatarUrl } = req.body;

        if (!avatarUrl) {
            return res.status(400).json({ success: false, error: 'Avatar URL is required' });
        }

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.profileImage = avatarUrl;
        await user.save();

        res.json({ success: true, data: { profileImage: avatarUrl } });

    } catch (error) {
        console.error('Update avatar error:', error);
        res.status(500).json({ success: false, error: 'Failed to update avatar' });
    }
});

export default router;

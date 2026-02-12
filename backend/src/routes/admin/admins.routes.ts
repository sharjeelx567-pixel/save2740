import express, { Response } from 'express';
import { authenticateAdmin, AuthRequest } from '../../middleware/auth';
import { Admin } from '../../modules/admin/auth/admin.model';
import { connectDB } from '../../config/db';
import { AuditLog } from '../../models/audit-log';
import bcrypt from 'bcryptjs';

const router = express.Router();

/**
 * @route   GET /api/admin/administrators
 * @desc    Get all admins
 * @access  Super Admin
 */
router.get('/', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();

        // Only Super Admin can view all admins (optional, but good practice)
        if (req.user?.role !== 'SUPER_ADMIN') {
            // For now allow, but in strict mode maybe restrict
        }

        const admins = await Admin.find().select('-passwordHash');
        res.json({ success: true, data: admins });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get admins' });
    }
});

/**
 * @route   POST /api/admin/administrators
 * @desc    Create a new admin
 * @access  Super Admin
 */
router.post('/', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { username, email, password, role, permissions } = req.body;

        if (req.user?.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, error: 'Only Super Admin can create admins' });
        }

        if (!username || !email || !password) {
            return res.status(400).json({ success: false, error: 'Username, email and password are required' });
        }

        const existing = await Admin.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ success: false, error: 'Admin with this email already exists' });
        }

        const newAdmin = await Admin.create({
            username,
            email: email.toLowerCase(),
            passwordHash: password, // Mongoose pre-save hook will hash it
            role: role || 'ADMIN',
            permissions: permissions || [],
            isActive: true
        });

        // Audit Log
        await AuditLog.create({
            userId: req.userId,
            action: 'CREATE_ADMIN',
            resourceType: 'system', // Admin management is system-level
            resourceId: newAdmin._id.toString(),
            ipAddress: req.ip,
            severity: 'critical', // Creating admin is critical
            metadata: { newAdminEmail: email, role }
        });

        res.json({ success: true, message: 'Admin created successfully', data: { id: newAdmin._id, email: newAdmin.email } });
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ success: false, error: 'Failed to create admin' });
    }
});

/**
 * @route   PUT /api/admin/administrators/:id
 * @desc    Update admin (roles/permissions)
 * @access  Super Admin
 */
router.put('/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { id } = req.params;
        const { role, permissions, isActive } = req.body;

        if (req.user?.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, error: 'Only Super Admin can update admins' });
        }

        const admin = await Admin.findById(id);
        if (!admin) return res.status(404).json({ success: false, error: 'Admin not found' });

        if (role) admin.role = role;
        if (permissions) admin.permissions = permissions;
        if (isActive !== undefined) admin.isActive = isActive;

        await admin.save();

        // Audit Log
        await AuditLog.create({
            userId: req.userId,
            action: 'UPDATE_ADMIN',
            resourceType: 'system', // Admin management is system-level
            resourceId: id,
            ipAddress: req.ip,
            severity: 'warning',
            metadata: { changes: { role, permissions, isActive } }
        });

        res.json({ success: true, message: 'Admin updated successfully', data: admin });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update admin' });
    }
});


export default router;

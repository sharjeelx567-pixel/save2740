/**
 * Admin Useful Links CMS API
 * Full CRUD, version history, rollback. All mutations audited.
 */

import express, { Response } from 'express';
import { authenticateAdmin, AuthRequest } from '../../middleware/auth';
import { UsefulLink } from '../../models/useful-link.model';
import { AuditLog } from '../../models/audit-log';
import { connectDB } from '../../config/db';

const router = express.Router();

// GET /api/admin/useful-links — list all (any status)
router.get('/', authenticateAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const links = await UsefulLink.find().sort({ displayOrder: 1 }).lean();
    return res.json({ success: true, data: links });
  } catch (error) {
    console.error('Admin get useful links error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load links' });
  }
});

// GET /api/admin/useful-links/:id — get one with full content and versions
router.get('/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const doc = await UsefulLink.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ success: false, error: 'Link not found' });
    return res.json({ success: true, data: doc });
  } catch (error) {
    console.error('Admin get useful link error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load link' });
  }
});

// POST /api/admin/useful-links — create
router.post('/', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { title, slug, content, enabled, status, displayOrder, effectiveDate } = req.body;
    const userId = req.userId || 'unknown';
    if (!title || !slug) {
      return res.status(400).json({ success: false, error: 'Title and slug are required' });
    }
    const normalizedSlug = String(slug).toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existing = await UsefulLink.findOne({ slug: normalizedSlug });
    if (existing) {
      return res.status(400).json({ success: false, error: 'A link with this slug already exists' });
    }
    const link = await UsefulLink.create({
      title,
      slug: normalizedSlug,
      content: content || '',
      enabled: enabled !== false,
      status: status || 'draft',
      displayOrder: typeof displayOrder === 'number' ? displayOrder : 0,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
      lastEditedBy: userId,
      lastEditedAt: new Date(),
      versions: [],
    });
    await AuditLog.create({
      userId,
      action: 'USEFUL_LINK_CREATE',
      resourceType: 'content',
      resourceId: link._id.toString(),
      changes: [{ field: 'slug', oldValue: null, newValue: link.slug }],
      severity: 'info',
    });
    return res.status(201).json({ success: true, data: link });
  } catch (error) {
    console.error('Admin create useful link error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create link' });
  }
});

// PUT /api/admin/useful-links/:id — full update (pushes version)
router.put('/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const link = await UsefulLink.findById(req.params.id);
    if (!link) return res.status(404).json({ success: false, error: 'Link not found' });
    const userId = req.userId || 'unknown';
    const { title, slug, content, enabled, status, displayOrder, effectiveDate } = req.body;

    const oldDoc = { title: link.title, slug: link.slug, content: link.content, status: link.status, enabled: link.enabled };
    const changes: { field: string; oldValue: any; newValue: any }[] = [];

    if (title !== undefined) {
      changes.push({ field: 'title', oldValue: link.title, newValue: title });
      link.title = title;
    }
    if (slug !== undefined) {
      const normalizedSlug = String(slug).toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const existing = await UsefulLink.findOne({ slug: normalizedSlug, _id: { $ne: link._id } });
      if (existing) return res.status(400).json({ success: false, error: 'Slug already in use' });
      changes.push({ field: 'slug', oldValue: link.slug, newValue: normalizedSlug });
      link.slug = normalizedSlug;
    }
    if (content !== undefined) {
      changes.push({ field: 'content', oldValue: (link.content || '').slice(0, 100), newValue: (content || '').slice(0, 100) });
      link.versions.push({
        title: link.title,
        slug: link.slug,
        content: link.content,
        updatedBy: userId,
        updatedAt: new Date(),
      });
      link.content = content;
    }
    if (typeof enabled === 'boolean') {
      changes.push({ field: 'enabled', oldValue: link.enabled, newValue: enabled });
      link.enabled = enabled;
    }
    if (status !== undefined && ['draft', 'published', 'archived'].includes(status)) {
      changes.push({ field: 'status', oldValue: link.status, newValue: status });
      link.status = status;
    }
    if (typeof displayOrder === 'number') link.displayOrder = displayOrder;
    if (effectiveDate !== undefined) link.effectiveDate = effectiveDate ? new Date(effectiveDate) : undefined;

    link.lastEditedBy = userId;
    link.lastEditedAt = new Date();
    await link.save();

    if (changes.length) {
      await AuditLog.create({
        userId,
        action: 'USEFUL_LINK_UPDATE',
        resourceType: 'content',
        resourceId: link._id.toString(),
        changes,
        severity: 'info',
      });
    }
    return res.json({ success: true, data: link });
  } catch (error) {
    console.error('Admin update useful link error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update link' });
  }
});

// PATCH /api/admin/useful-links/:id — partial (reorder, enable, status only, no version push)
router.patch('/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const link = await UsefulLink.findById(req.params.id);
    if (!link) return res.status(404).json({ success: false, error: 'Link not found' });
    const userId = req.userId || 'unknown';
    const { displayOrder, enabled, status } = req.body;
    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    if (typeof displayOrder === 'number') {
      changes.push({ field: 'displayOrder', oldValue: link.displayOrder, newValue: displayOrder });
      link.displayOrder = displayOrder;
    }
    if (typeof enabled === 'boolean') {
      changes.push({ field: 'enabled', oldValue: link.enabled, newValue: enabled });
      link.enabled = enabled;
    }
    if (status !== undefined && ['draft', 'published', 'archived'].includes(status)) {
      changes.push({ field: 'status', oldValue: link.status, newValue: status });
      link.status = status;
    }
    link.lastEditedBy = userId;
    link.lastEditedAt = new Date();
    await link.save();
    if (changes.length) {
      await AuditLog.create({
        userId,
        action: 'USEFUL_LINK_PATCH',
        resourceType: 'content',
        resourceId: link._id.toString(),
        changes,
        severity: 'info',
      });
    }
    return res.json({ success: true, data: link });
  } catch (error) {
    console.error('Admin patch useful link error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update link' });
  }
});

// POST /api/admin/useful-links/:id/rollback — restore from version index (0 = latest previous)
router.post('/:id/rollback', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const link = await UsefulLink.findById(req.params.id);
    if (!link) return res.status(404).json({ success: false, error: 'Link not found' });
    const userId = req.userId || 'unknown';
    const versionIndex = Math.max(0, parseInt(String(req.body.versionIndex), 10) || 0);
    if (!link.versions || link.versions.length === 0) {
      return res.status(400).json({ success: false, error: 'No version history to rollback' });
    }
    const v = link.versions[versionIndex];
    if (!v) return res.status(400).json({ success: false, error: 'Invalid version index' });
    const oldContent = link.content;
    link.content = v.content;
    link.title = v.title;
    link.slug = v.slug;
    link.lastEditedBy = userId;
    link.lastEditedAt = new Date();
    await link.save();
    await AuditLog.create({
      userId,
      action: 'USEFUL_LINK_ROLLBACK',
      resourceType: 'content',
      resourceId: link._id.toString(),
      changes: [{ field: 'content', oldValue: (oldContent || '').slice(0, 100), newValue: (v.content || '').slice(0, 100) }],
      severity: 'info',
    });
    return res.json({ success: true, data: link });
  } catch (error) {
    console.error('Admin rollback useful link error:', error);
    return res.status(500).json({ success: false, error: 'Failed to rollback' });
  }
});

export default router;

/**
 * Public Useful Links API
 * Used by frontend to render footer/menu links and policy pages.
 * Only returns published + enabled links.
 */

import express, { Response } from 'express';
import { UsefulLink } from '../models/useful-link.model';
import { connectDB } from '../config/db';

const router = express.Router();

// GET /api/useful-links — list all visible links (for sidebar/footer)
router.get('/', async (_req, res: Response) => {
  try {
    await connectDB();
    const links = await UsefulLink.find({
      status: 'published',
      enabled: true,
    })
      .sort({ displayOrder: 1 })
      .select('title slug displayOrder lastEditedAt')
      .lean();
    return res.json({ success: true, data: links });
  } catch (error) {
    console.error('Get useful links error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load links' });
  }
});

// GET /api/useful-links/:slug — get single page content by slug (for policy page)
router.get('/:slug', async (req, res: Response) => {
  try {
    await connectDB();
    const slug = (req.params.slug || '').toLowerCase().trim();
    const link = await UsefulLink.findOne({
      slug,
      status: 'published',
      enabled: true,
    })
      .select('title slug content lastEditedAt')
      .lean();
    if (!link) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }
    return res.json({ success: true, data: link });
  } catch (error) {
    console.error('Get useful link by slug error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load page' });
  }
});

export default router;

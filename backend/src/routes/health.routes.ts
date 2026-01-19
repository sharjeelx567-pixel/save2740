import express from 'express';

const router = express.Router();

// TODO: Implement health routes
// Migrate logic from app/api/health/**

router.get('/', (req, res) => {
  res.json({ success: true, message: 'health API - To be implemented' });
});

export default router;

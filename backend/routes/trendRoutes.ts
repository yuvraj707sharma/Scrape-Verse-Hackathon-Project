import { Router } from 'express';
import { getTechTrends } from '../db.js';

const router = Router();

router.get('/v1/trends', (req, res) => {
  try {
    const trends = getTechTrends();
    res.json(trends);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

import { Router } from 'express';
import { queryRag } from '../ragEngine.js';

const router = Router();

router.post('/v1/rag/query', (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'question required' });
    
    const result = queryRag(question);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

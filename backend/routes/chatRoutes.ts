import { Router } from 'express';
import { processChatQuery } from '../chatService.js';

const router = Router();

// POST /api/chat - Process user question against indexed web chunks with citations
router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const response = await processChatQuery(message, history || []);
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

import { Router } from 'express';
import { generateMediaScript } from '../scriptWriter.js';

const router = Router();

router.post('/v1/scripts/generate', async (req, res) => {
  try {
    const { topic, format } = req.body;
    if (!topic || !format) return res.status(400).json({ error: 'topic and format required' });

    const result = await generateMediaScript(topic, format);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

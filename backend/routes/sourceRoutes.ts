import { Router } from 'express';
import { getAllSources, deleteSource } from '../db.js';
import { scrapeAndIndexUrl } from '../sourceScraper.js';

const router = Router();

// GET /api/sources - List all indexed sources
router.get('/sources', (req, res) => {
  try {
    const sources = getAllSources();
    res.json(sources);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sources/add - Scrape and index a new URL
router.post('/sources/add', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const result = await scrapeAndIndexUrl(url);
    res.json({ success: true, source: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sources/:id - Remove an indexed source
router.delete('/sources/:id', (req, res) => {
  try {
    deleteSource(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

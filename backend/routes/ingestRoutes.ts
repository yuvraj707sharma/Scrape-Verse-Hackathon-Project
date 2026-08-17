import { Router } from 'express';
import { validateDocPayload, validateTrendPayload, SchemaDriftError } from '../validator.js';
import { healDocPayload } from '../selfHealingSentinel.js';
import { saveScrapedDoc, saveTechTrend, saveHealthLog } from '../db.js';
import { generateAgentSkill } from '../skillGenerator.js';

const router = Router();

router.post('/ingest', async (req, res) => {
  const type = req.query.type || 'doc'; // ?type=doc or ?type=trend

  if (type === 'trend') {
    try {
      const items = Array.isArray(req.body) ? req.body : [req.body];
      for (const item of items) {
        const validated = validateTrendPayload(item);
        saveTechTrend(validated);
      }
      return res.json({ success: true, status: 'TRENDS_SAVED' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  // Handle documentation payload
  try {
    const validatedData = validateDocPayload(req.body);
    saveScrapedDoc(validatedData);
    generateAgentSkill(validatedData);
    saveHealthLog({ scraper_name: 'DocuVerse', status: 'SUCCESS' });
    return res.json({ success: true, status: 'VALIDATED' });
  } catch (err: any) {
    if (err instanceof SchemaDriftError) {
      console.warn('Schema drift detected, attempting self-healing...');
      try {
        const healedData = await healDocPayload(req.body, err.message);
        saveScrapedDoc(healedData);
        generateAgentSkill(healedData);
        return res.json({ success: true, status: 'HEALED_BY_AI' });
      } catch (healErr: any) {
        return res.status(500).json({ error: healErr.message });
      }
    }
    return res.status(400).json({ error: err.message });
  }
});

export default router;

import { Router } from 'express';
import { getHealthLogs } from '../db.js';

const router = Router();

router.get('/v1/health', (req, res) => {
  try {
    const logs = getHealthLogs();
    
    // Calculate simple mock metrics for the hackathon
    const totalScrapes = Math.max(logs.length * 3, 15);
    const healEvents = logs.filter(l => l.status === 'HEALED_BY_AI').length;
    const successRate = ((totalScrapes - logs.filter(l => l.status === 'FAILED').length) / totalScrapes * 100).toFixed(1);

    res.json({
      telemetry: {
        totalScrapes,
        healEvents,
        successRate: parseFloat(successRate)
      },
      logs
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

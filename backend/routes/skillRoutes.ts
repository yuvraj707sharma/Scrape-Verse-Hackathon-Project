import { Router } from 'express';
import { getAllSkills } from '../db.js';

const router = Router();

router.get('/v1/skills', (req, res) => {
  try {
    const skills = getAllSkills();
    res.json(skills);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import ingestRoutes from './backend/routes/ingestRoutes.js';
import skillRoutes from './backend/routes/skillRoutes.js';
import ragRoutes from './backend/routes/ragRoutes.js';
import trendRoutes from './backend/routes/trendRoutes.js';
import scriptRoutes from './backend/routes/scriptRoutes.js';
import healthRoutes from './backend/routes/healthRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', ingestRoutes);
app.use('/api', skillRoutes);
app.use('/api', ragRoutes);
app.use('/api', trendRoutes);
app.use('/api', scriptRoutes);
app.use('/api', healthRoutes);

// Serve static frontend files in production
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`DevVerse Server running on port ${PORT}`);
});

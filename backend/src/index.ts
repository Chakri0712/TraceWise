import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import uploadRouter from './routes/upload.js';
import analyzeRouter from './routes/analyze.js';
import resultsRouter from './routes/results.js';
import reportRouter from './routes/report.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/upload', uploadRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/results', resultsRouter);
app.use('/api/report', reportRouter);

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

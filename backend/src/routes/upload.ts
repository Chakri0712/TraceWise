import { Router } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { parseFile } from '../parsers/index.js';
import { randomUUID } from 'crypto';
import { unlinkSync } from 'fs';

const prisma = new PrismaClient();
const router = Router();

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.md', '.pdf', '.txt', '.docx'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}`));
    }
  },
});

router.post('/', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const run = await prisma.run.create({
      data: { status: 'uploaded' },
    });

    const documents = [];
    for (const file of files) {
      const content = await parseFile(file.path, file.originalname);
      const doc = await prisma.document.create({
        data: {
          filename: file.originalname,
          type: file.mimetype || 'unknown',
          content,
          runId: run.id,
        },
      });
      documents.push({ id: doc.id, filename: doc.filename });
      unlinkSync(file.path);
    }

    res.json({
      runId: run.id,
      status: 'uploaded',
      documents,
    });
  } catch (e) {
    console.error('[Upload] Error:', e);
    res.status(500).json({ error: String(e) });
  }
});

export default router;

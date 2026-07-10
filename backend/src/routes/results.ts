import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { existsSync } from 'fs';

const prisma = new PrismaClient();
const router = Router();

router.get('/:runId', async (req, res) => {
  try {
    const { runId } = req.params;

    const run = await prisma.run.findUnique({
      where: { id: runId },
    });

    if (!run) {
      res.status(404).json({ error: 'Run not found' });
      return;
    }

    const results = run.results ? JSON.parse(run.results) : {};

    res.json({
      runId: run.id,
      status: run.status,
      coverage: run.coverage,
      gaps: run.gaps ? JSON.parse(run.gaps) : [],
      requirements: results.requirements || [],
      testCases: results.testCases || [],
      generatedTestCases: results.generatedTestCases || [],
      matches: results.matches || [],
      orphanTestCases: results.orphanTestCases || [],
      reportPath: results.reportPath || null,
      createdAt: run.createdAt,
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;

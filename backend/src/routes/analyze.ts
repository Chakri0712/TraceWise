import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { graph } from '../agents/graph.js';
import type { AgentState } from '../agents/state.js';

const prisma = new PrismaClient();
const router = Router();

router.post('/:runId', async (req, res) => {
  try {
    const { runId } = req.params;
    const traceId = randomUUID();

    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: { documents: true },
    });

    if (!run) {
      res.status(404).json({ error: 'Run not found' });
      return;
    }

    await prisma.run.update({
      where: { id: runId },
      data: { status: 'analyzing' },
    });

    const initialState: AgentState = {
      runId,
      traceId,
      documents: run.documents.map(d => ({
        filename: d.filename,
        type: d.type,
        content: d.content,
      })),
      requirements: [],
      testCases: [],
      generatedTestCases: [],
      requirementEmbeddings: {},
      testCaseEmbeddings: {},
      matches: [],
      gaps: [],
      coverage: 0,
    };

    console.log(`[Analyze] Starting analysis for run ${runId}...`);
    const result = await graph.invoke(initialState);

    await prisma.run.update({
      where: { id: runId },
      data: {
        status: 'completed',
        coverage: result.coverage,
        gaps: JSON.stringify(result.gaps),
        results: JSON.stringify({
          requirements: result.requirements,
          testCases: result.testCases,
          generatedTestCases: result.generatedTestCases,
          matches: result.matches,
          reportPath: result.reportPath,
        }),
      },
    });

    console.log(`[Analyze] Run ${runId} completed. Coverage: ${result.coverage}%`);

    res.json({
      runId,
      status: 'completed',
      coverage: result.coverage,
      traceId,
      langfuseUrl: process.env.LANGFUSE_HOST ? `${process.env.LANGFUSE_HOST}/trace/${traceId}` : null,
      requirements: result.requirements,
      testCases: result.testCases,
      generatedTestCases: result.generatedTestCases,
      matches: result.matches,
      gaps: result.gaps,
      reportPath: result.reportPath,
    });
  } catch (e) {
    console.error('[Analyze] Error:', e);
    res.status(500).json({ error: String(e) });
  }
});

export default router;

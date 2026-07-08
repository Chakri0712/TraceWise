import { Router } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

const router = Router();
const REPORTS_DIR = join(import.meta.dirname, '../../reports');

router.get('/:runId', (req, res) => {
  const { runId } = req.params;

  const pdfPath = join(REPORTS_DIR, `${runId}.pdf`);
  if (existsSync(pdfPath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="pdlc-report-${runId}.pdf"`);
    res.sendFile(pdfPath);
    return;
  }

  const htmlPath = join(REPORTS_DIR, `${runId}.html`);
  if (existsSync(htmlPath)) {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(htmlPath);
    return;
  }

  res.status(404).json({ error: 'Report not found. Run analysis first.' });
});

export default router;

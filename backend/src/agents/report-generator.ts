import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { AgentState } from './state.js';
import { getLangfuse, flushLangfuse } from '../langfuse.js';

const REPORTS_DIR = join(import.meta.dirname, '../../reports');

export async function reportGenerator(state: AgentState): Promise<Partial<AgentState>> {
  console.log('[ReportGenerator] Generating PDF report...');

  const langfuse = getLangfuse();
  const trace = langfuse?.trace({ id: state.traceId, name: 'ReportGenerator' });
  const span = trace?.span({ name: 'generatePDF' });

  if (!existsSync(REPORTS_DIR)) {
    mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const html = renderReport(state);
  const reportPath = join(REPORTS_DIR, `${state.runId}.pdf`);

  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: reportPath,
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true,
    });
    await browser.close();
    console.log(`[ReportGenerator] PDF saved to ${reportPath}`);
    span?.end({ output: { path: reportPath, format: 'pdf' } });
  } catch (e) {
    console.error('[ReportGenerator] Puppeteer failed, saving HTML instead:', e);
    const htmlPath = join(REPORTS_DIR, `${state.runId}.html`);
    writeFileSync(htmlPath, html);
    span?.end({ output: { path: htmlPath, format: 'html' } });
    await flushLangfuse();
    return { reportPath: htmlPath };
  }

  await flushLangfuse();
  return { reportPath };
}

function renderReport(state: AgentState): string {
  const date = new Date().toISOString().split('T')[0];
  const coveredCount = state.requirements.length - state.gaps.length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PDLC Coverage Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; line-height: 1.6; padding: 40px; }
    .header { text-align: center; border-bottom: 3px solid #4361ee; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 28px; color: #1a1a2e; }
    .header p { color: #666; margin-top: 5px; }
    h2 { font-size: 20px; color: #4361ee; margin: 25px 0 15px; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px; }
    .summary { display: flex; gap: 20px; margin-bottom: 30px; }
    .card { flex: 1; background: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #e0e0e0; }
    .card .value { font-size: 36px; font-weight: bold; color: #4361ee; }
    .card .label { font-size: 14px; color: #666; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
    th { background: #f8f9fa; font-weight: 600; }
    .covered { color: #2e7d32; }
    .missing { color: #c62828; font-weight: bold; }
    .gap-item { background: #fff3f3; border-left: 4px solid #c62828; padding: 12px 15px; margin: 10px 0; border-radius: 0 4px 4px 0; }
    .gap-item .req-id { font-weight: bold; color: #c62828; }
    .suggested { color: #2e7d32; font-style: italic; margin-top: 5px; }
    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #e0e0e0; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PDLC Coverage Report</h1>
    <p>Generated on ${date} | Run ID: ${state.runId}</p>
  </div>

  <h2>Executive Summary</h2>
  <div class="summary">
    <div class="card">
      <div class="value">${state.coverage.toFixed(0)}%</div>
      <div class="label">Coverage</div>
    </div>
    <div class="card">
      <div class="value">${state.requirements.length}</div>
      <div class="label">Total Requirements</div>
    </div>
    <div class="card">
      <div class="value">${state.testCases.length}</div>
      <div class="label">Test Cases Uploaded</div>
    </div>
    <div class="card">
      <div class="value">${state.gaps.length}</div>
      <div class="label">Gaps Flagged</div>
    </div>
  </div>

  <h2>Traceability Matrix</h2>
  <table>
    <thead>
      <tr>
        <th>Requirement</th>
        <th>Linked Test Case</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${state.requirements.map(req => {
        const match = state.matches.find(m => m.requirementId === req.id);
        const status = match ? '✅ Covered' : '❌ MISSING';
        const statusClass = match ? 'covered' : 'missing';
        return `<tr>
          <td>${req.id}: ${req.text}</td>
          <td>${match ? match.testCaseId : '—'}</td>
          <td class="${statusClass}">${status}</td>
        </tr>`;
      }).join('\n      ')}
    </tbody>
  </table>

  <h2>Coverage Gaps</h2>
  ${state.gaps.length === 0 ? '<p>No gaps found — all requirements have test coverage.</p>' : ''}
  ${state.gaps.map(gap => `
  <div class="gap-item">
    <div class="req-id">${gap.requirementId}</div>
    <div>${gap.reason}</div>
    ${gap.suggestedTest ? `<div class="suggested">Suggested: ${gap.suggestedTest}</div>` : ''}
  </div>`).join('')}

  <h2>Existing Test Cases</h2>
  <table>
    <thead>
      <tr><th>ID</th><th>Description</th></tr>
    </thead>
    <tbody>
      ${state.testCases.map(tc => `<tr><td>${tc.id}</td><td>${tc.text}</td></tr>`).join('\n      ')}
    </tbody>
  </table>

  <h2>AI-Generated Test Cases</h2>
  <table>
    <thead>
      <tr><th>ID</th><th>Description</th><th>For Requirement</th></tr>
    </thead>
    <tbody>
      ${state.generatedTestCases.map(tc => `<tr><td>${tc.id}</td><td>${tc.text}</td><td>${tc.requirementId || '—'}</td></tr>`).join('\n      ')}
    </tbody>
  </table>

  <div class="footer">
    <p>PDLC Hackathon — Requirements Traceability & Coverage Analysis</p>
    <p>Powered by LangGraph.js + Puppeteer</p>
  </div>
</body>
</html>`;
}

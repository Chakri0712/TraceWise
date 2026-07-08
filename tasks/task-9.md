# Task 9: Build Report Download + Results Endpoint

**Status:** Complete

## What Was Done
Created GET /api/results/:runId for polling analysis status and GET /api/report/:runId for downloading the generated PDF report.

## Files Created
- `backend/src/routes/results.ts` — Returns run status, coverage, gaps from DB
- `backend/src/routes/report.ts` — Streams PDF or HTML report to browser

## API Flow
```
POST /api/upload          → Create run, save docs
POST /api/analyze/:runId  → Run agents, generate PDF
GET  /api/results/:runId  → Get coverage, gaps (for polling)
GET  /api/report/:runId   → Download PDF report
```

## Key Decisions
- Results endpoint returns cached data from DB (no re-computation)
- Report endpoint tries PDF first, falls back to HTML
- PDF served as attachment (download), HTML served inline

## Verification
- `GET /api/results/:runId` returns status + coverage
- `GET /api/report/:runId` downloads PDF file

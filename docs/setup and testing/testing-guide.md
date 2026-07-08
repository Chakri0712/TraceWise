# Manual Testing Guide

Step-by-step guide to test the PDLC Dashboard locally.

---

## Prerequisites

1. **Node.js 20+** installed — verify with `node --version`
2. **LLM API key** configured in `backend/.env` (see `docs/user-setup.md`)
3. **Dependencies installed** — run from project root:

```bash
npm install
```

4. **Prisma client generated + SQLite database created**:

```bash
npm run db:push -w backend
```

---

## Step 1: Start the Backend

Open a terminal and run:

```bash
npm run dev:backend
```

Wait for:
```
Server running on http://localhost:3001
```

### Verify Backend is Running

Open another terminal:
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{"status":"ok","db":"connected","timestamp":"..."}
```

---

## Step 2: Start the Frontend

Open another terminal and run:

```bash
npm run dev:frontend
```

Wait for:
```
VITE v6.x.x  ready in xxx ms
```

---

## Step 3: Open the Dashboard

Open your browser to: **http://localhost:3000**

You should see the upload page with a drag-drop zone.

---

## Step 4: Test File Upload

### Option A: Use Sample Data

The sample files are at `backend/sample/`:
- `requirements.md` — 4 requirements
- `test_cases.md` — 2 test cases

### Option B: Create Your Own

Create two markdown files:

**requirements.md:**
```markdown
- Req-1: Users must log in with email and password.
- Req-2: Users must log in with Google OAuth.
- Req-3: Dashboard must load in under 2 seconds.
- Req-4: Users must be able to export reports as PDF.
```

**test_cases.md:**
```markdown
- Test-1: Verify email/password login succeeds with valid credentials.
- Test-2: Verify dashboard load time is under 2 seconds.
```

### Upload

1. Drag both files onto the upload zone (or click to browse)
2. Verify both files appear in the file list
3. Click **"Upload & Analyze"**
4. Wait for redirect to dashboard

---

## Step 5: Verify Dashboard Results

The dashboard should show:

### Summary Cards
| Metric | Expected Value |
|--------|----------------|
| Coverage | **50%** |
| Requirements | **4** |
| Test Cases | **2** |
| Gaps | **2** |

### Traceability Matrix
| Requirement | Test Case | Status |
|-------------|-----------|--------|
| Req-1: Users must log in with email and password | Test-1 | ✅ Covered |
| Req-2: Users must log in with Google OAuth | — | ❌ MISSING |
| Req-3: Dashboard must load in under 2 seconds | Test-2 | ✅ Covered |
| Req-4: Users must be able to export reports as PDF | — | ❌ MISSING |

### Coverage Gaps
Two gap cards should appear:
- **Req-2**: No test case found for Google OAuth login
- **Req-4**: No test case found for PDF export

### AI-Generated Test Cases
Four generated test cases should appear (one per requirement).

---

## Step 6: Download PDF Report

1. Click **"Download PDF Report"** button
2. A PDF file should download
3. Open the PDF and verify it contains:
   - Executive summary with 50% coverage
   - Traceability matrix
   - Coverage gaps section
   - Existing test cases
   - AI-generated test cases

---

## Step 7: Verify Langfuse Traces (Optional)

If Langfuse is configured:

1. Open your Langfuse dashboard (https://cloud.langfuse.com)
2. Find the trace for your run
3. Verify you see 4 agent spans:
   - RequirementRefiner
   - TestCaseGenerator
   - TraceabilityAgent
   - ReportGenerator

---

## API Testing (Alternative)

If you prefer testing via API directly:

### Upload Files
```bash
curl -X POST http://localhost:3001/api/upload \
  -F "files=@backend/sample/requirements.md" \
  -F "files=@backend/sample/test_cases.md"
```

Response:
```json
{"runId":"...","status":"uploaded","documents":[...]}
```

### Run Analysis
```bash
curl -X POST http://localhost:3001/api/analyze/<runId>
```

### Get Results
```bash
curl http://localhost:3001/api/results/<runId>
```

### Download Report
```bash
curl -O http://localhost:3001/api/report/<runId>
```

---

## Troubleshooting

### "Server running" but health check fails
- Wait 5 seconds for Prisma to initialize
- Check `backend/.env` has correct `DATABASE_URL`

### Upload fails with "Unsupported file type"
- Ensure files have correct extensions (.md, .pdf, .txt, .docx)
- Check filename contains "req" or "test" for proper categorization

### Analysis returns 0% coverage
- Verify requirements file filename contains "req"
- Verify test cases file filename contains "test"
- Check content format matches expected pattern (Req-N:, Test-N:)

### PDF download shows HTML instead
- Puppeteer may not be installed properly
- Run `npm install puppeteer` in backend directory
- Check system has Chrome/Chromium available

### Langfuse traces not appearing
- Verify all 3 Langfuse env vars are set
- Check Langfuse dashboard for the correct project
- Traces may take a few seconds to appear

---

## Running Everything at Once

From the project root:
```bash
npm run dev
```

This starts both backend (port 3001) and frontend (port 3000) concurrently.

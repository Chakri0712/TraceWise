# PDLC Hackathon — Architecture

## Overview

AI-powered agents that analyze requirement-to-test-case traceability, identify coverage gaps, and generate professional PDF reports. The system uses LLM-powered parsing, embedding-based semantic similarity, and a 4-agent LangGraph pipeline.

## System Architecture

```
Frontend (Vite + React)              Backend (Express + Prisma)           External Services
┌──────────────────────┐             ┌───────────────────────┐            ┌─────────────────┐
│  Home.tsx             │  POST       │  /api/upload           │            │                 │
│  (Upload page)        │───────────>│  upload.ts             │──parse───>│  SQLite (Prisma)│
│  - drag-drop files    │            │  - multer (file I/O)   │            │  Run + Document │
│  - .md/.pdf/.txt/.docx│            │  - parsers/index.ts    │            │  models         │
│                       │            │  - Prisma: Run + Doc   │            └─────────────────┘
│                       │            └───────────────────────┘
│                       │
│  Dashboard.tsx        │  POST       ┌───────────────────────┐  fetch    ┌─────────────────┐
│  (Results page)       │───────────>│  /api/analyze/:runId   │─────────>│  LLM Client     │
│  - coverage stats     │            │  analyze.ts            │          │  llm-client.ts  │
│  - traceability matrix│            │  - graph.invoke()      │          │  - Azure APIM   │
│  - gaps + suggestions │            │                        │          │  - OpenAI compat │
│  - AI-generated tests │            │  LangGraph Pipeline:   │          └─────────────────┘
│  - PDF download       │            │  1. requirementRefiner │
│                       │            │  2. testCaseGenerator  │  embed   ┌─────────────────┐
│                       │            │  3. traceabilityAgent  │─────────>│  Embeddings API │
│                       │            │  4. reportGenerator    │          │  text-embedding  │
│                       │            └───────────────────────┘          │  -3-large        │
│                       │                                               └─────────────────┘
│  GET /api/results     │<────────  Returns stored results from DB
│  GET /api/report      │<────────  Serves PDF from reports/
└──────────────────────┘
                                     Optional:
                                   ┌─────────────────┐
                                   │  Langfuse        │
                                   │  (Observability) │
                                   └─────────────────┘
```

## Data Flow

### Step 1: Upload Files
**Endpoint**: `POST /api/upload` | **File**: `backend/src/routes/upload.ts`

1. User selects files (`.md`, `.pdf`, `.txt`, `.docx`) on the Home page
2. Frontend sends files via `multipart/form-data`
3. `multer` saves files to `uploads/` directory
4. `parsers/index.ts` extracts text content (pdf-parse, mammoth, marked)
5. Prisma creates a `Run` record (status: `uploaded`) and `Document` records
6. Temporary files are deleted from `uploads/`
7. Response: `{ runId, status: "uploaded", documents: [...] }`

### Step 2: Trigger Analysis
**Endpoint**: `POST /api/analyze/:runId` | **File**: `backend/src/routes/analyze.ts`

1. Frontend redirects to Dashboard with `?runId=xxx`
2. Dashboard checks status via `GET /api/results/:runId`
3. If status is `uploaded`, triggers analysis via `POST /api/analyze/:runId`
4. Backend loads Run + Documents from SQLite
5. Invokes the LangGraph pipeline with initial state

### Step 3: LangGraph Pipeline
**File**: `backend/src/agents/graph.ts`

The pipeline runs 4 agents sequentially:

```
[START]
  ↓
[RequirementRefiner]   → LLM parses requirements into structured JSON
  ↓                     → Computes embeddings for each requirement
[TestCaseGenerator]    → LLM generates test cases from requirements
  ↓
[TraceabilityAgent]    → Computes embeddings for uploaded test cases
  ↓                     → Cosine similarity matching (threshold: 0.6)
  ↓                     → Falls back to word-level matching if embeddings fail
[ReportGenerator]      → Renders HTML report → Puppeteer → PDF
  ↓
[END → PDF saved + results returned]
```

#### Agent 1: RequirementRefiner
**File**: `backend/src/agents/requirement-refiner.ts`

- Filters documents by filename (contains "req" or "test")
- Calls LLM to parse requirements into structured JSON `[{id, text, priority}]`
- Falls back to regex parsing if LLM fails
- Parses uploaded test cases via regex
- **Computes embeddings** for each requirement using `text-embedding-3-large`
- **Output**: `requirements[]`, `testCases[]`, `requirementEmbeddings{}`

#### Agent 2: TestCaseGenerator
**File**: `backend/src/agents/test-case-generator.ts`

- Takes requirements from Agent 1
- Calls LLM to generate 1-2 test cases per requirement
- Falls back to keyword-based generation if LLM fails
- **Output**: `generatedTestCases[]`

#### Agent 3: TraceabilityAgent
**File**: `backend/src/agents/test-case-generator.ts` (same file)

- Computes embeddings for each uploaded test case
- **Primary**: Cosine similarity between requirement and test case embeddings (threshold: 0.6)
- **Fallback**: Word-level Jaccard + stem matching + synonym dictionary (threshold: 0.2)
- Calculates coverage percentage
- Identifies gaps (uncovered requirements)
- **Output**: `matches[]`, `gaps[]`, `coverage`, `testCaseEmbeddings{}`

#### Agent 4: ReportGenerator
**File**: `backend/src/agents/report-generator.ts`

- Renders HTML report with styled CSS (traceability matrix, gaps, test cases)
- Converts HTML to PDF via Puppeteer (A4 format)
- Falls back to serving HTML if Puppeteer fails
- **Output**: `reportPath`

### Step 4: Save Results
After pipeline completes, Prisma updates the Run record with status, coverage, gaps, and full results JSON.

### Step 5: Display Results
**File**: `frontend/src/pages/Dashboard.tsx`

- Coverage percentage (color-coded)
- Requirements count, test cases count, gaps count
- Traceability matrix (requirement → test case mapping)
- Coverage gaps with AI-generated suggestions
- AI-generated test cases table
- "Download PDF Report" button

### Step 6: Download PDF
**Endpoint**: `GET /api/report/:runId` | **File**: `backend/src/routes/report.ts`

- Serves the PDF file from `backend/reports/`
- Filename format: `PDLC-Coverage-Report-YYYY-MM-DD.pdf`

## Semantic Similarity

The traceability agent uses **embedding-based cosine similarity** to match requirements to test cases:

1. **Embedding**: Each requirement and test case is converted to a 1536-dimensional vector using `text-embedding-3-large`
2. **Similarity**: Cosine similarity between vectors (range: 0 to 1)
3. **Threshold**: 0.6 for a match (stricter than word-level, more accurate)
4. **Fallback**: If embeddings API fails, degrades to word-level Jaccard similarity (threshold: 0.2)

**Example**: "Users must log in with Google OAuth" ↔ "Login via Google OAuth successful flow" → **63% similarity** (match)

## LLM Configuration

**File**: `backend/src/llm-client.ts`

Two provider types via `.env`:

| Provider | `LLM_PROVIDER` | Auth | Use Case |
|----------|----------------|------|----------|
| Azure APIM | `azure-apim` | `api-key` header | Hackathon-provided endpoint |
| OpenAI-compatible | `openai` | Bearer token | Any OpenAI-compatible API |

**Available models** (Azure APIM): `gpt-5-mini`, `gpt-5.2`, `gpt-5.4`, `codex`, `text-embedding-3-large`

**Model-aware behavior**:
- gpt-5+ models: uses `max_completion_tokens`, temperature=1
- Older models: uses `max_tokens`, temperature=0.2

**To switch providers**: Edit `backend/.env`, change `LLM_PROVIDER`, `LLM_MODEL`, and API key. Restart backend.

## Langfuse Observability

**File**: `backend/src/langfuse.ts`

Optional integration for tracing AI agent execution:

- Lazy-initialized from environment variables (`LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST`)
- Returns `null` if not configured — system works without it
- Traces each LLM call with input/output metadata
- Trace ID included in API response for linking to Langfuse dashboard

## Database Schema

**File**: `backend/prisma/schema.prisma`

```prisma
model Run {
  id          String   @id @default(cuid())
  status      String   @default("pending")  // pending | uploaded | analyzing | completed
  coverage    Float?                          // percentage
  gaps        String?                         // JSON array of gaps
  results     String?                         // Full analysis JSON
  createdAt   DateTime @default(now())
  documents   Document[]
}

model Document {
  id        String @id @default(cuid())
  filename  String
  type      String
  content   String
  runId     String
  run       Run    @relation(fields: [runId], references: [id])
}
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Database connectivity check |
| `/api/upload` | POST | Accept files, parse, store in DB |
| `/api/analyze/:runId` | POST | Trigger full LangGraph pipeline |
| `/api/results/:runId` | GET | Return cached analysis results |
| `/api/report/:runId` | GET | Stream PDF/HTML report to browser |

## File Structure

```
backend/
├── src/
│   ├── index.ts              # Express server setup
│   ├── llm-client.ts         # Unified LLM client (Azure APIM, OpenAI)
│   ├── langfuse.ts           # Langfuse observability (optional)
│   ├── agents/
│   │   ├── state.ts          # AgentState type definitions
│   │   ├── graph.ts          # LangGraph pipeline definition
│   │   ├── requirement-refiner.ts   # Agent 1: Parse requirements + embeddings
│   │   ├── test-case-generator.ts   # Agent 2+3: Generate tests + traceability
│   │   └── report-generator.ts      # Agent 4: HTML → PDF via Puppeteer
│   ├── routes/
│   │   ├── upload.ts         # POST /api/upload
│   │   ├── analyze.ts        # POST /api/analyze/:runId
│   │   ├── results.ts        # GET /api/results/:runId
│   │   └── report.ts         # GET /api/report/:runId
│   └── parsers/
│       └── index.ts          # File parsers (.md/.pdf/.txt/.docx)
├── prisma/
│   └── schema.prisma         # Database schema
├── sample/                   # Sample test data
│   ├── requirements.md       # 12 e-commerce requirements
│   └── test_cases.md         # 5 test cases (creates coverage gaps)
├── reports/                  # Generated PDFs
├── .env                      # Configuration (API keys, provider)
└── package.json

frontend/
├── src/
│   ├── main.tsx              # React root + BrowserRouter
│   ├── index.css             # Global styles
│   └── pages/
│       ├── Home.tsx          # Upload page (drag-drop)
│       └── Dashboard.tsx     # Results (stats, matrix, gaps, PDF)
├── vite.config.ts            # Vite config with API proxy
└── package.json
```

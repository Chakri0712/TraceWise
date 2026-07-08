# Project Folder Structure

```
PDLC Sample/
├── package.json                    # Root workspace config (npm workspaces)
├── .gitignore                      # Excludes node_modules, .env, *.db, reports/
├── architecture_setup.md           # Original architecture design document
├── pdlc-implementation.md          # Implementation task plan (all tasks checked)
│
├── tasks/                          # Task documentation
│   ├── task-1.md                   # Monorepo scaffolding
│   ├── task-2.md                   # Express + Prisma + SQLite
│   ├── task-3.md                   # Prisma schema
│   ├── task-4.md                   # LangGraph agent skeleton
│   ├── task-5.md                   # RequirementRefinerAgent
│   ├── task-6.md                   # TestCaseGenerator + Traceability
│   ├── task-7.md                   # File upload + parsers
│   ├── task-8.md                   # Analyze endpoint + ReportGenerator
│   ├── task-9.md                   # Report download + results
│   ├── task-10.md                  # Next.js dashboard
│   └── task-11.md                  # Langfuse observability
│
├── docs/                           # User documentation
│   ├── user-setup.md               # Prerequisites & configuration
│   ├── folder-structure.md         # This file
│   └── testing-guide.md            # Manual testing walkthrough
│
├── backend/                        # Node.js Express backend
│   ├── package.json                # Backend dependencies & scripts
│   ├── tsconfig.json               # TypeScript config (ES2022, NodeNext)
│   ├── .env                        # Environment variables (API keys, DB URL)
│   │
│   ├── prisma/
│   │   ├── schema.prisma           # Data models (Run, Document)
│   │   └── dev.db                  # SQLite database (auto-created)
│   │
│   ├── src/
│   │   ├── index.ts                # Express server entry point
│   │   ├── langfuse.ts             # Langfuse client singleton
│   │   │
│   │   ├── agents/                 # AI agent pipeline
│   │   │   ├── state.ts            # AgentState, Requirement, TestCase, Gap types
│   │   │   ├── graph.ts            # LangGraph StateGraph (4-node pipeline)
│   │   │   ├── requirement-refiner.ts   # Agent 1: Parse requirements from docs
│   │   │   ├── test-case-generator.ts   # Agent 2+3: Generate tests + traceability
│   │   │   └── report-generator.ts      # Agent 4: HTML → PDF via Puppeteer
│   │   │
│   │   ├── routes/                 # Express API routes
│   │   │   ├── upload.ts           # POST /api/upload (multipart file upload)
│   │   │   ├── analyze.ts          # POST /api/analyze/:runId (trigger pipeline)
│   │   │   ├── results.ts          # GET /api/results/:runId (poll status)
│   │   │   └── report.ts           # GET /api/report/:runId (download PDF)
│   │   │
│   │   └── parsers/
│   │       └── index.ts            # File parsers (md, txt, pdf, docx)
│   │
│   ├── reports/                    # Generated PDF reports (auto-created)
│   ├── uploads/                    # Temp upload directory (auto-cleaned)
│   └── sample/                     # Demo data
│       ├── requirements.md         # 4 sample requirements
│       └── test_cases.md           # 2 sample test cases (creates gaps)
│
└── frontend/                       # Next.js 14 frontend
    ├── package.json                # Frontend dependencies & scripts
    ├── tsconfig.json               # TypeScript config (ES2017, bundler)
    ├── next.config.js              # API proxy rewrites to localhost:3001
    │
    └── src/app/
        ├── layout.tsx              # Root layout (html, body, metadata)
        ├── page.tsx                # Upload page (drag-drop file selector)
        ├── globals.css             # Global styles (265 lines)
        │
        └── dashboard/
            └── page.tsx            # Dashboard (stats, matrix, gaps, PDF link)
```

---

## What Each Key File Does

### Backend Core

| File | Purpose |
|------|---------|
| `src/index.ts` | Boots Express server, mounts routes, health endpoint |
| `src/langfuse.ts` | Lazy-init Langfuse client; returns null if not configured |
| `prisma/schema.prisma` | Defines Run + Document models for SQLite |

### Agent Pipeline

| File | Purpose |
|------|---------|
| `agents/state.ts` | TypeScript interfaces shared across all agents |
| `agents/graph.ts` | LangGraph pipeline: refiner → generator → traceability → report |
| `agents/requirement-refiner.ts` | Parses requirements from uploaded docs (LLM + regex fallback) |
| `agents/test-case-generator.ts` | Generates test cases + computes coverage gaps via similarity |
| `agents/report-generator.ts` | Renders HTML report template, converts to PDF with Puppeteer |

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/health` | GET | Database connectivity check |
| `/api/upload` | POST | Accept files, parse, store in DB |
| `/api/analyze/:runId` | POST | Trigger full agent pipeline |
| `/api/results/:runId` | GET | Return cached analysis results |
| `/api/report/:runId` | GET | Stream PDF/HTML report to browser |

### Frontend

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Upload page with drag-drop, file list, upload button |
| `src/app/dashboard/page.tsx` | Results display: stats, matrix, gaps, generated tests |
| `src/app/globals.css` | All visual styling (responsive, color-coded status) |
| `next.config.js` | Proxy `/api/*` requests to backend on port 3001 |

# PDLC Hackathon — Implementation Plan

## Goal
Build a prototype that takes requirements + test cases, generates test coverage analysis with traceability, flags gaps, and produces a downloadable PDF report.

---

## Tasks

### Phase 1: Project Scaffolding
- [x] **1. Initialize monorepo structure**
  - Create `backend/` and `frontend/` directories
  - Run `npm init` in each with appropriate scripts
  - Create root `package.json` with workspace config
  - **Verify:** Both directories have `package.json` with dev/start scripts

### Phase 2: Backend Core
- [x] **2. Set up Express + Prisma + SQLite**
  - `npm install express prisma @prisma/client dotenv cors`
  - `npx prisma init` → configure SQLite in `schema.prisma`
  - Create `src/index.ts` with Express server on port 3001
  - Create `.env` with `DATABASE_URL="file:./dev.db"`
  - **Verify:** `npm run dev` starts server, `npx prisma db push` creates `.db` file

- [x] **3. Create Prisma schema for runs**
  - Define `Run` model: id, status, coverage%, gaps JSON, results JSON, createdAt
  - Define `Document` model: id, filename, type, content, runId
  - Push schema to SQLite
  - **Verify:** `npx prisma studio` shows empty tables

### Phase 3: Agent Layer
- [x] **4. Set up LangGraph.js agent skeleton**
  - Install `@langchain/langgraph` for state machine orchestration
  - Create `src/agents/state.ts` with shared `AgentState` type
  - Create `src/agents/graph.ts` with 4-agent pipeline skeleton
  - **Verify:** Graph compiles, agents are callable

- [x] **5. Implement RequirementRefinerAgent**
  - Read documents from agent state (uploaded via Prisma)
  - Call LLM to parse requirements into structured JSON `{id, text, priority}`
  - Fall back to regex parsing if LLM fails
  - **Verify:** Upload sample reqs → agent returns structured JSON

- [x] **6. Implement TestCaseGeneratorAgent + TraceabilityAgent**
  - Generate test cases from requirements via LLM
  - Compare uploaded test cases against requirements using word-level Jaccard similarity + stem matching + synonym dictionary
  - Output: `{ coverage: %, gaps: [{ reqId, reason }], matches: [...] }`
  - **Verify:** Upload sample data → coverage shows ~42%, 7 gaps flagged

### Phase 4: File Upload & Parsing
- [x] **7. Build file upload endpoint with parsers**
  - Install: `pdf-parse mammoth marked`
  - Create `POST /api/upload` accepting `.md`, `.pdf`, `.txt`, `.docx`
  - Parse files and store content in SQLite via Prisma
  - **Verify:** Upload `requirements.md` + `test_cases.md` → documents appear in database

### Phase 5: Analysis & Report
- [x] **8. Create analyze endpoint + ReportGeneratorAgent**
  - `POST /api/analyze/:runId` triggers LangGraph run
  - ReportGeneratorAgent renders HTML template with Puppeteer
  - Save PDF to `reports/` directory
  - **Verify:** `POST /api/analyze` → PDF generated in `reports/` folder

- [x] **9. Build report download endpoint**
  - `GET /api/report/:runId` streams PDF to browser
  - Return structured results for dashboard: `GET /api/results/:runId`
  - **Verify:** Open browser → PDF downloads with correct content

### Phase 6: Frontend
- [x] **10. Create Vite dashboard**
  - `npm create vite@latest frontend` with React template
  - Build upload page (`/`) with drag-drop for `.md` files
  - Build dashboard (`/dashboard`) with coverage cards + matrix preview
  - Add PDF download button
  - **Verify:** Upload files → see coverage → download PDF

### Phase 7: Observability
- [x] **11. Integrate Langfuse**
  - `npm install langfuse`
  - Wrap LLM calls with trace spans in each agent
  - Add trace ID to report footer
  - **Verify:** Langfuse dashboard shows 4 agent spans per run

---

## Done When
- [x] Upload sample `requirements.md` + `test_cases.md`
- [x] See coverage percentage (12 requirements, 5 test cases → ~42%)
- [x] Gaps flagged for uncovered requirements
- [x] Download PDF report with all sections
- [x] Langfuse shows agent execution trace

---

## Notes
- Use `tsx` for TypeScript compilation in backend (`npm i -D tsx`)
- Azure APIM key goes in `.env` — never commit it
- Sample data files are in `backend/sample/`
- Frontend proxies API calls to `localhost:3001` via Vite proxy

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
  - Define `Run` model: id, status, coverage%, gaps JSON, createdAt
  - Define `Document` model: id, filename, type, content, runId
  - Push schema to SQLite
  - **Verify:** `npx prisma studio` shows empty tables

### Phase 3: Agent Layer
- [x] **4. Set up LangGraph.js + LangChain.js + ChromaDB**
  - `npm install @langchain/core @langchain/community @langchain/google-genre langchain chromadb langgraph`
  - Create `src/agents/state.ts` with shared state type
  - Create `src/agents/graph.ts` with 4-agent pipeline skeleton
  - **Verify:** Graph compiles, agents are callable

- [x] **5. Implement RequirementRefinerAgent**
  - Query ChromaDB for uploaded requirements
  - Call LLM to structure requirements into JSON format
  - Output: `{ requirements: [{ id, text, priority }] }`
  - **Verify:** Upload sample reqs → agent returns structured JSON

- [x] **6. Implement TestCaseGeneratorAgent + TraceabilityAgent**
  - Generate test cases from requirements via LLM
  - Compare generated vs uploaded test cases using vector similarity
  - Output: `{ coverage: %, gaps: [{ reqId, reason }], matches: [...] }`
  - **Verify:** Upload sample data → coverage shows 50%, 2 gaps flagged

### Phase 4: File Upload & Parsing
- [x] **7. Build file upload endpoint with parsers**
  - Install: `pdf-parse mammoth marked`
  - Create `POST /api/upload` accepting `.md`, `.pdf`, `.txt`, `.docx`
  - Parse files → chunk with `RecursiveCharacterTextSplitter` → store in ChromaDB
  - Save document metadata to SQLite via Prisma
  - **Verify:** Upload `requirements.md` + `test_cases.md` → files appear in ChromaDB collections

### Phase 5: Analysis & Report
- [x] **8. Create analyze endpoint + ReportGeneratorAgent**
  - `POST /api/analyze` triggers LangGraph run
  - ReportGeneratorAgent renders HTML template with Puppeteer
  - Save PDF to `reports/` directory
  - **Verify:** `POST /api/analyze` → PDF generated in `reports/` folder

- [x] **9. Build report download endpoint**
  - `GET /api/report/:runId` streams PDF to browser
  - Return structured results for dashboard: `GET /api/results/:runId`
  - **Verify:** Open browser → PDF downloads with correct content

### Phase 6: Frontend
- [x] **10. Create Next.js dashboard**
  - `npx create-next-app@14 frontend` with App Router
  - Build upload page (`/`) with drag-drop for `.md` files
  - Build dashboard (`/dashboard`) with coverage cards + matrix preview
  - Add PDF download button
  - **Verify:** Upload files → see 50% coverage → download PDF

### Phase 7: Observability
- [x] **11. Integrate Langfuse**
  - `npm install langfuse`
  - Wrap LLM calls with trace spans in each agent
  - Add trace ID to report footer
  - **Verify:** Langfuse dashboard shows 4 agent spans per run

---

## Done When
- [x] Upload sample `requirements.md` + `test_cases.md`
- [x] See coverage: 50% (2/4 requirements covered)
- [x] Gaps flagged: Req-2, Req-4
- [x] Download PDF report with all sections
- [x] Langfuse shows agent execution trace

---

## Notes
- Use `tsx` for TypeScript compilation in backend (`npm i -D tsx`)
- ChromaDB runs locally on port 8000 — start with `chroma run` before testing
- Azure APIM key goes in `.env` — never commit it
- Sample data files are in `architecture_setup.md` §4
- Frontend proxies API calls to `localhost:3001` via Next.js rewrites

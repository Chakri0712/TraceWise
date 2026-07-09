# Tracewise AI — PDLC Requirements Traceability Engine

AI-powered Product Development Lifecycle traceability that converts requirements and test cases into actionable coverage reports — in seconds, not hours.

## The Problem

Teams spend 4+ hours manually tracing requirements to test cases across scattered documents (PDF, DOCX, Markdown, TXT). The process is error-prone, misses coverage gaps, and breaks when test cases exist without matching requirements.

## The Solution

Upload your requirements and test cases in any format. The AI pipeline:

1. **Requirement Refiner** — Extracts structured requirements from documents via LLM (with regex fallback)
2. **Test Case Generator** — Generates comprehensive test cases at 4 levels (Unit/Integration/System/Acceptance)
3. **Traceability Agent** — Bidirectional matching: requirements→test cases AND orphan detection
4. **Report Generator** — Produces a professional PDF coverage report with traceability matrix

## Key Features

- **Multi-format input** — PDF, DOCX, Markdown, TXT
- **Multi-format output** — PDF, DOCX, TXT compliance documents
- **Bidirectional traceability** — Detects both coverage gaps AND orphan test cases
- **Domain-agnostic** — Works for software, EV, civil engineering, payments, aerospace
- **Backwards compatible** — Handles test cases that exist without matching requirements
- **Observability** — Langfuse integration for LLM call tracing

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp backend/.env.example backend/.env
# Edit backend/.env with your Azure APIM or OpenAI credentials

# Run database migrations
npx prisma migrate dev --schema=backend/prisma/schema.prisma

# Start both frontend and backend
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Sample Data

Upload files from `backend/sample/` to test the pipeline:

| Domain | Requirements | Test Cases | Expected Coverage |
|--------|-------------|------------|-------------------|
| Software (E-Commerce) | `requirements.md` | `test_cases.md` | ~42% |
| EV / Electrical | `ev-electrical/requirements.md` | `ev-electrical/test_cases.md` | ~42% |
| Mechanical (CNC) | `mechanical/requirements.md` | `mechanical/test_cases.md` | ~42% |
| Civil (Bridge) | `civil/requirements.md` | `civil/test_cases.md` | ~42% |
| Payments (Banking) | `payments/requirements.md` | `payments/test_cases.md` | ~42% |
| Aerospace (Drone) | `aerospace/requirements.md` | `aerospace/test_cases.md` | ~42% |
| Backwards Compat | `backwards-compat/requirements.md` | `backwards-compat/test_cases.md` | ~62% (3 orphans) |

## Architecture

```
Frontend (React + Vite)     Backend (Express + LangGraph)
  │                            │
  │  POST /api/upload          │  Multer → Parser → Prisma
  │  POST /api/analyze/:id     │  LangGraph Pipeline:
  │  GET  /api/results/:id     │    Refiner → Generator → Traceability → Report
  │  GET  /api/report/:id      │  Puppeteer → PDF
  │                            │
  └────────── Vite Proxy ──────┘
```

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, React Router
- **Backend:** Express, TypeScript, Prisma (SQLite), LangGraph
- **AI:** Azure APIM / OpenAI (GPT-5.2), Embeddings API
- **Observability:** Langfuse
- **PDF:** Puppeteer (with HTML fallback)

## Documentation

- [Architecture](docs/Architecture/ARCHITECTURE.md) — System design and data flow
- [Setup Guide](docs/setup%20and%20testing/user-setup.md) — Detailed installation
- [Testing Guide](docs/setup%20and%20testing/testing-guide.md) — How to test
- [Jury Q&A Notes](docs/planning/jury-qa-notes.md) — Technical defense preparation

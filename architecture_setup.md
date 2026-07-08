# PDLC Hackathon — Architecture & Pre-Implementation Setup

## System Architecture Overview

```mermaid
flowchart TD
    subgraph BROWSER["Browser (Client)"]
        UI["PDLC Dashboard\n(Next.js / React)"]
    end

    subgraph BACKEND["Backend (Node.js · Express)"]
        API["REST API Layer\n/upload  /analyze  /report  /chat"]
        AGENTS["Agent Service\n(LangGraph.js)"]
        subgraph AGENTS_DETAIL["LangGraph Agents"]
            A1["Requirement Refiner Agent"]
            A2["Test Case Generator Agent"]
            A3["Traceability Agent (Core)"]
            A4["Report Generator Agent"]
        end
    end

    subgraph STORES["Storage Layer"]
        DB[("Relational DB\nSQLite — Hackathon 🟢\nMySQL — Production 🔵")]
        VDB[("Vector DB\n(ChromaDB local\nor Pinecone cloud)\n— chunked docs, reqs, tests")]
    end

    subgraph EXTERNAL["External Services"]
        LLM["LLM API\n(Gemini / OpenAI / Anthropic)"]
        LF["Langfuse\n(Observability & Tracing)"]
    end

    UI -- "HTTP (REST / fetch)" --> API
    API -- "CRUD" --> DB
    API -- "invoke" --> AGENTS
    AGENTS -- "query / upsert" --> VDB
    AGENTS -- "chat completions" --> LLM
    AGENTS -- "trace spans" --> LF
    A1 --> A2 --> A3 --> A4
```

---

## 📄 Primary Deliverable: PDF Coverage Report

The **official deliverable** is:
> *"A prototype that takes a requirement set, generates test cases with traceability, flags coverage gaps and produces a status/coverage summary"*

The primary output of the system is a **downloadable PDF report** generated server-side by Puppeteer. The on-screen dashboard is a preview of the same data.

### PDF Report Structure

| Section | Content |
|---|---|
| **1. Header** | Project name, date generated, powered-by footer |
| **2. Executive Summary** | Overall coverage % (e.g., 50%), total reqs, total test cases, gaps count |
| **3. Traceability Matrix** | Full mapping table: each requirement → linked test case(s) ✅ or MISSING ❌ |
| **4. Coverage Gaps** | Requirements with zero coverage — flagged red, with AI-generated reason for each gap |
| **5. Existing Test Cases** | All test cases uploaded by the user, listed for reference |
| **6. AI-Generated Test Cases** | AI-suggested test cases for every uncovered requirement |
| **7. Langfuse Trace Link** | Direct URL to the observability dashboard for this analysis run |

### Sample Report Numbers (from demo data)

```
Total Requirements  : 4
Test Cases Uploaded : 2  (Test-1, Test-2)
Covered             : 2  (Req-1, Req-3)  — 50%
Gaps Flagged        : 2  (Req-2, Req-4)  ← AI caught these

Existing Test Cases:
  Test-1: Verify email/password login succeeds with valid credentials.
  Test-2: Verify dashboard load time is under 2 seconds.

AI-Generated Test Cases:
  → For Req-2: "Verify user can sign in using Google OAuth button"
  → For Req-4: "Verify report downloads as a valid PDF file with correct content"
```

> 🎯 **Demo moment:** Click "Download Report" → a professional PDF lands in the browser. Open it live on the projector. Judges see coverage %, all test cases, and flagged gaps — everything in one document.

---

## Layer-by-Layer Architecture

### 🖥️ Frontend — Next.js (React)

| Area | Tech | Responsibility |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | SSR, routing, API proxy |
| UI Components | React + Vanilla CSS | Dashboard, upload form, matrix |
| State | React Context / Zustand | Upload status, analysis results |
| Data Fetching | `fetch` / SWR | Poll backend for analysis results |
| Visualization | Custom CSS grid | Red/green traceability matrix (on-screen preview) |
| Chat Interface | React component | Ask-the-agent chat box |
| **Report Download** | **Native `<a download>` link** | Triggers `/api/report/:runId` → streams PDF to browser |

**Key pages:**
- `/` — Upload requirements & test documents
- `/dashboard` — Coverage summary cards + traceability matrix preview
- `/dashboard/report` — **Download PDF report button** (primary deliverable)
- `/chat` — RAG-powered Q&A on gaps

---

### ⚙️ Backend — Node.js (Express)

| Area | Tech | Responsibility |
|---|---|---|
| Framework | **Express.js** | HTTP server, routing |
| ORM | **Prisma** | DB schema & queries — works with SQLite AND MySQL, one-line switch |
| Agent Orchestration | **LangGraph.js** + LangChain.js | Multi-step AI agent state machines |
| File Parsing | `pdf-parse`, `mammoth`, `marked`, native `fs` | Extract text from PDF, Word (.doc/.docx), Markdown, and plain text files |
| Vector Operations | LangChain `VectorStore` adapter | Chunk & embed docs into Vector DB |
| **PDF Generation** | **Puppeteer** | Renders HTML report template → PDF file server-side |
| Observability | **Langfuse Node SDK** | Wrap LLM calls with trace spans |
| Environment | `dotenv` | Manage API keys |

**Key API routes:**
```
POST  /api/upload          — Receive req & test documents, chunk → Vector DB
POST  /api/analyze         — Trigger LangGraph agent run
GET   /api/results/:runId  — Poll structured gap report (JSON)
GET   /api/report/:runId   — Stream generated PDF to browser (primary deliverable)
POST  /api/chat            — RAG-powered Q&A
GET   /api/traces          — Link to Langfuse dashboard
```

### 📁 Supported Upload Formats

| Format | Extension | Library | Notes |
|---|---|---|---|
| **Markdown** | `.md` | `marked` | Native to the hackathon sample data |
| **PDF** | `.pdf` | `pdf-parse` | Most common format for real requirement docs |
| **Plain Text** | `.txt` | Node.js `fs.readFile` | No library needed — read directly as string |
| **Word Document** | `.doc`, `.docx` | `mammoth` | Converts Word to plain text or HTML for chunking |

> ⚠️ **Note on `.doc` (old Word format):** `mammoth` handles `.docx` natively and `.doc` with best-effort extraction. For the hackathon demo, `.docx` is the recommended Word format.
>
> All parsed text is then passed through **LangChain's `RecursiveCharacterTextSplitter`** before being stored in the Vector DB as chunks.

---

### 🤖 Agent Layer — LangGraph.js State Machine

```
[START]
  ↓
[RequirementRefinerAgent]   → reads uploaded reqs from Vector DB → outputs structured JSON
  ↓
[TestCaseGeneratorAgent]    → generates expected test cases from requirements
  ↓
[TraceabilityAgent]         → compares generated vs. actual test cases → outputs Gaps Report JSON
  ↓
[ReportGeneratorAgent]      → takes Gaps Report JSON → renders HTML template → Puppeteer → PDF
  ↓
[END → PDF saved to disk + download URL returned to API]
```

Each agent node:
- Queries Vector DB for relevant context (RAG)
- Calls LLM with structured prompt
- Writes output back to LangGraph state
- Emits Langfuse trace span

---

### 🗄️ Storage Layer

| Store | Hackathon Engine 🟢 | Production Engine 🔵 | What it holds |
|---|---|---|---|
| Relational DB | **SQLite** (zero install, just a `.db` file) | **MySQL** (multi-user concurrency) | Projects, run metadata, user sessions |
| Vector DB | **ChromaDB** (local, 2 pip commands) | **Pinecone** (cloud, scalable) | Embedded document chunks |

---

## 🧠 Why These Tools? (Rationale)

### 🔍 RAG + Vector DB — Why Not Just SQL?

**The core problem:** Your requirements say *"Google Login"*. A test case says *"Verify OAuth sign-in works"*. These mean the same thing, but share zero words in common.

| Approach | How it searches | Result for this case |
|---|---|---|
| **SQL `LIKE` / full-text** | Matches exact words or substrings | ❌ Fails — "Google" ≠ "OAuth" |
| **RAG + Vector DB** | Converts text to math vectors, measures *meaning similarity* | ✅ Matches — both describe the same login concept |

**How it works in practice:**
1. Upload a requirement: *"Google Login"* → converted to a vector `[0.21, -0.87, 0.44, ...]`
2. Upload a test case: *"Verify OAuth sign-in"* → converted to a nearby vector `[0.19, -0.83, 0.41, ...]`
3. ChromaDB computes the distance between these vectors — they're close → **match found**

> 💡 **Analogy:** SQL is a keyword search. Vector DB is Google Search — it understands what you mean, not just what you typed. For requirements traceability, meaning matters more than words.

---

### 🔷 LangGraph.js — Why Not Just Call Agents One by One?

**The problem with chaining agents manually:**
```js
// Fragile manual approach — no error handling, no state, no retries
const step1 = await refinerAgent(docs);
const step2 = await testGenAgent(step1.output);
const step3 = await traceabilityAgent(step2.output);
const step4 = await reportAgent(step3.output);
```

**What breaks:** If step 2 fails, you restart from scratch. State is lost. Debugging is blind. Conditional logic (e.g., "re-run if coverage < 30%") requires more manual wiring.

**LangGraph gives you:**
- A **named state object** that flows through all agents — every agent reads from and writes to the same shared state
- Automatic **error boundaries** per node
- **Conditional edges** (e.g., loop back to refiner if output is malformed)
- A visual graph you can inspect during development

> 💡 **Analogy:** LangGraph is Express.js for AI pipelines. You *could* write raw `http.createServer()` — but why would you?

---

### 📊 Langfuse — Why Do We Need Observability?

**During development:** When an agent outputs wrong JSON or the coverage % is incorrect, how do you know *which* LLM call caused it? What exact prompt was sent? What did the model return? Without Langfuse, you're completely blind.

**During the demo:** You open the Langfuse dashboard live on the projector:
```
Run #1 — 12:34:01
  ├─ RequirementRefinerAgent   ✓  1.2s   420 tokens
  ├─ TestCaseGeneratorAgent    ✓  2.1s   810 tokens
  ├─ TraceabilityAgent         ✓  1.8s   630 tokens
  └─ ReportGeneratorAgent      ✓  0.9s   PDF generated
```
Judges literally **watch the AI brain working in real time**. That's your biggest demo wow moment.

> 💡 **Analogy:** Langfuse is Chrome DevTools Network tab — but for AI calls. You can't debug a backend without DevTools; you can't debug an AI pipeline without Langfuse.

---

### 🔗 LangChain.js — Is It Required?

**Short answer:** Optional, but it saves ~200 lines of boilerplate for the RAG parts.

| Task | Without LangChain | With LangChain |
|---|---|---|
| Connect to ChromaDB | Write raw HTTP calls to ChromaDB REST API | `new Chroma(embeddings, { collectionName })` |
| Chunk uploaded documents | Write your own text splitter | `new RecursiveCharacterTextSplitter({ chunkSize: 500 })` |
| Generate embeddings | Call Gemini embed API manually, handle batching | `new GoogleGenerativeAIEmbeddings({ model: 'embedding-001' })` |
| Query Vector DB for context | Manually format query + parse results | `.similaritySearch(query, 4)` |

**Verdict for the hackathon:** Use it. It's `npm install langchain` — no config, no account. The time saved on RAG plumbing is better spent on the PDF report and UI.

---

### ✅ Tool Decision Summary

| Tool | Needed? | Role in one sentence |
|---|---|---|
| **RAG + Vector DB** | ✅ Required | Finds semantic matches between reqs and tests — SQL can't do this |
| **LangGraph.js** | ✅ Required | Manages the 4-agent state machine reliably |
| **Langfuse** | ⭐ Strongly recommended | Makes agents visible — critical for debugging and demo wow factor |
| **LangChain.js** | 🟡 Optional but saves time | Provides ready-made connectors for ChromaDB, embeddings, and chunking |

---

## ✅ Manual Setup Checklist

> Everything below must be done **before** you run `/create` or start implementation.

---

### 🔧 1. Software to Install Locally

| # | Software | Version | Notes |
|---|---|---|---|
| 1 | **Node.js** | ≥ 20 LTS | https://nodejs.org — use `nvm` recommended |
| 2 | **Git** | any | https://git-scm.com |
| 3 | **Python 3.10+** *(only for ChromaDB)* | ≥ 3.10 | https://python.org — skip if using Pinecone |
| 4 | **ChromaDB** *(only for local Vector DB)* | latest | `pip install chromadb` then `chroma run` |
| 5 | **MySQL** *(future/production only)* | ≥ 8.0 | https://dev.mysql.com/downloads/ — NOT needed for hackathon |

> ✅ **SQLite requires zero install** — Prisma creates the `.db` file automatically on first run.
> **OR** skip ChromaDB and use **Pinecone** (cloud, no Python needed).

---

### 🔑 2. Accounts & Credentials to Create

#### LLM API (Core Application vs. Development)

> 💡 **Hackathon Strategy:** The hackathon provides a powerful **Azure APIM (GPT-5 Codex)** endpoint, but it has a strict **2M token limit per team**. 
> - **For Development:** Use free-tier AI coding assistants (like Antigravity or OpenCode) within your IDE. Do *not* plug the APIM key into IDE autocomplete extensions, as it will drain your 2M token budget within hours.
> - **For the Core App:** Use the provided APIM key *exclusively* for the application's backend AI calls. This preserves your budget for testing and the final demo.
> - **Fallback:** Because we abstract the LLM calls (e.g., via LangChain), the provider is just a config toggle. If you run out of tokens before the demo, you can instantly swap to a personal OpenAI/Gemini key by changing one line in the `.env` file!

| Provider | Purpose | Sign-up URL / Info | Environment Variables |
|---|---|---|---|
| **Azure APIM (GPT-5)** ⭐ | **Core App** (Hackathon Provided) | Use the team key & endpoint | `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY` |
| **Google Gemini** (Fallback) | **Core App Fallback** (Generous free tier)| https://aistudio.google.com | `GEMINI_API_KEY` |
| **Antigravity / OpenCode** | **Development** (Unlimited/Free coding) | Within IDE | N/A |

#### Vector Database (Pick ONE)

| Provider | Free Tier? | Sign-up URL | What you get |
|---|---|---|---|
| **ChromaDB** (local) ⭐ | ✅ Fully free | `pip install chromadb` — no account | No credentials needed |
| **Pinecone** (cloud) | ✅ Free starter | https://app.pinecone.io | `PINECONE_API_KEY` + index name |

#### Observability

| Tool | Free Tier? | Sign-up URL | What you get |
|---|---|---|---|
| **Langfuse** ⭐ | ✅ Free cloud tier | https://cloud.langfuse.com | `LANGFUSE_PUBLIC_KEY` + `LANGFUSE_SECRET_KEY` + `LANGFUSE_HOST` |

#### Relational Database (Pick ONE)

| Option | Setup | Connection String |
|---|---|---|
| **SQLite** ⭐ *(hackathon)* | Nothing — Prisma auto-creates `dev.db` | `file:./dev.db` |
| **MySQL** *(production path)* | Install MySQL, create DB + user | `mysql://pdlc_user:password@localhost:3306/pdlc_hackathon` |

> Switching between them in Prisma is a **one-line change** in `schema.prisma` — so you can start with SQLite and upgrade to MySQL later as a demo enhancement.

---

### 📄 3. The `.env` File You'll Need

Once accounts are created, your backend `.env` will look like this:

```env
# LLM - Hackathon Provided (Primary for Core App)
AZURE_OPENAI_ENDPOINT=https://apim-foundry-dev-z1hvd.azure-api.net/codex
AZURE_OPENAI_API_KEY=your_team_key_here
AZURE_OPENAI_API_VERSION=2025-04-01-preview

# LLM - Fallback (Uncomment if 2M token budget runs out)
# GEMINI_API_KEY=your_gemini_key_here
# OPENAI_API_KEY=sk-...

# Relational DB — SQLite (hackathon, zero setup)
DATABASE_URL="file:./dev.db"

# Relational DB — MySQL (production, comment out SQLite above and use this)
# DATABASE_URL="mysql://pdlc_user:yourpassword@localhost:3306/pdlc_hackathon"

# Vector DB — ChromaDB (local, no key needed)
CHROMA_HOST=http://localhost:8000

# Vector DB — Pinecone (if using cloud instead of ChromaDB)
# PINECONE_API_KEY=your_pinecone_key
# PINECONE_INDEX_NAME=pdlc-docs

# Langfuse Observability
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com

# App
PORT=3001
NODE_ENV=development
```

---

### 🗂️ 4. Sample Data to Prepare

Create these two files manually for the demo:

**`requirements.md`**
```markdown
- Req-1: Users must log in with email and password.
- Req-2: Users must log in with Google OAuth.
- Req-3: Dashboard must load in under 2 seconds.
- Req-4: Users must be able to export reports as PDF.
```

**`test_cases.md`**
```markdown
- Test-1: Verify email/password login succeeds with valid credentials.
- Test-2: Verify dashboard load time is under 2 seconds.
```

> **Expected demo result:** AI flags **Req-2** (Google Login) and **Req-4** (PDF Export) as having no test coverage, and the downloadable PDF shows:
> - **Coverage: 50%** (2 of 4 requirements covered)
> - **Gaps section:** Req-2 — *"No test case found for Google OAuth login"*; Req-4 — *"No test case found for PDF export"*
> - **AI-suggested test cases** for both gaps 🎯

---

## 📋 Setup Priority Order

```
1. Install Node.js 20 LTS           (required to run anything)
2. Create Gemini API key             (free, 5 minutes — https://aistudio.google.com)
3. Sign up for Langfuse             (free, 5 minutes — https://cloud.langfuse.com)
4. Choose Vector DB:
   └── ChromaDB (local)  → pip install chromadb + chroma run  [easiest, needs Python]
   └── Pinecone (cloud)  → sign up + create index              [no Python needed]
5. SQLite is automatic — Prisma creates dev.db on first run, nothing to install!
6. Write .env file (copy template above, fill in your keys)
7. Prepare sample .md files (requirements.md + test_cases.md)
```

> ✅ **With SQLite, steps 1-4 are all you need before starting implementation.**

---

## ❓ Decision Guide: Which Options to Pick

### Relational DB

| | SQLite 🟢 | MySQL 🔵 |
|---|---|---|
| Install needed | ❌ None — auto created | ✅ Yes — MySQL server |
| Setup time | 0 minutes | 15-20 minutes |
| Multi-user support | ❌ Single writer only | ✅ Full concurrency |
| Best for | **Hackathon / Demo** | **Production** |
| Prisma switch cost | — | One line in `schema.prisma` |

### Vector DB

| | ChromaDB (local) | Pinecone (cloud) |
|---|---|---|
| Install needed | Python 3.10+ + pip | No (just an API key) |
| Setup time | 5 minutes | 5 minutes |
| Cost | Free | Free starter |
| Persistence | Local disk | Cloud |
| Best for hackathon | ✅ If Python already installed | ✅ If no Python on machine |

---

## 🚀 Production Roadmap (Present as Enhancements)

During the hackathon demo, present these as the **Phase 2 production roadmap** — it shows judges you've thought beyond the prototype:

| Enhancement | What it unlocks | Effort |
|---|---|---|
| **SQLite → MySQL** | Multi-user concurrency, production-ready storage | One-line Prisma config change |
| **ChromaDB local → Pinecone cloud** | Persistent vectors, scalable across servers | Swap API key + client init |
| **In-memory state → Redis** | Distributed agent state across multiple instances | Medium |
| **Single server → Docker / K8s** | Horizontal scaling, fault tolerance | Large |
| **Azure APIM (2M token limit) → Dedicated Enterprise LLM** | No quota limits, higher throughput | API key & Provider swap |

> 🎯 **Demo talking point:** *"We deliberately chose SQLite and ChromaDB for rapid prototyping. With Prisma as our ORM, upgrading to MySQL in production is literally a one-line configuration change — the application code doesn't change at all."*

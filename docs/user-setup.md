# User Setup Guide

Before running the PDLC Dashboard, you need to configure the following:

---

## 1. Environment Setup

Copy the example env file and fill in your keys:

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env` with your actual credentials.

---

## 2. LLM API Keys (Required)

The system needs an LLM provider to power the AI agents.

### Primary: Azure OpenAI (Hackathon Provided)

Edit `backend/.env` and replace the placeholder:

```env
AZURE_OPENAI_ENDPOINT=https://apim-foundry-dev-z1hvd.azure-api.net/codex
AZURE_OPENAI_API_KEY=your_actual_team_key_here
AZURE_OPENAI_API_VERSION=2025-04-01-preview
```

> **Important:** The hackathon provides a 2M token budget per team. Use this key ONLY for the application, not for IDE autocomplete.

### Fallback Options (If Budget Exhausted)

Uncomment one of these in `backend/.env`:

```env
# Google Gemini (free tier available)
# GEMINI_API_KEY=your_gemini_key_here

# OpenAI Direct
# OPENAI_API_KEY=sk-...
```

---

## 3. Langfuse Observability (Optional but Recommended)

Langfuse provides real-time tracing of AI agent execution — critical for debugging and demo wow factor.

1. Sign up at https://cloud.langfuse.com (free tier)
2. Create a project and get your keys
3. Edit `backend/.env`:

```env
LANGFUSE_PUBLIC_KEY=pk-lf-your_actual_key
LANGFUSE_SECRET_KEY=sk-lf-your_actual_key
LANGFUSE_HOST=https://cloud.langfuse.com
```

> **Without Langfuse:** The system works fine — you just won't see execution traces in the dashboard.

---

## 4. Supported Document Formats

Upload your requirements and test cases in any of these formats:

| Format | Extension | Notes |
|--------|-----------|-------|
| **Markdown** | `.md` | Recommended for hackathon. Use `Req-N:` prefix for requirements, `Test-N:` prefix for test cases |
| **Plain Text** | `.txt` | Same format as Markdown |
| **PDF** | `.pdf` | Most common for real requirement docs |
| **Word Document** | `.docx` | Converts to plain text (formatting lost) |

### Document Naming Convention

Files are identified by name:
- **Requirements file**: Filename must contain `req` (e.g., `requirements.md`, `REQ-doc.pdf`)
- **Test cases file**: Filename must contain `test` (e.g., `test_cases.md`, `TEST-cases.txt`)

### Expected Content Format

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

> **Tip:** The system uses semantic similarity to match requirements to test cases, so exact keyword overlap isn't required. "Google Login" will match "Verify OAuth sign-in works".

---

## 5. Environment Variables Reference

All variables go in `backend/.env`:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AZURE_OPENAI_ENDPOINT` | Yes* | — | Azure OpenAI API endpoint URL |
| `AZURE_OPENAI_API_KEY` | Yes* | — | Azure OpenAI authentication key |
| `AZURE_OPENAI_API_VERSION` | No | `2025-04-01-preview` | API version |
| `GEMINI_API_KEY` | No | — | Google Gemini fallback key |
| `OPENAI_API_KEY` | No | — | OpenAI direct fallback key |
| `DATABASE_URL` | No | `file:./dev.db` | SQLite database path |
| `CHROMA_HOST` | No | `http://localhost:8000` | ChromaDB endpoint (future use) |
| `LANGFUSE_PUBLIC_KEY` | No | — | Langfuse public key |
| `LANGFUSE_SECRET_KEY` | No | — | Langfuse secret key |
| `LANGFUSE_HOST` | No | `https://cloud.langfuse.com` | Langfuse host URL |
| `PORT` | No | `3001` | Backend server port |
| `NODE_ENV` | No | `development` | Environment mode |

*At least one LLM provider is required for AI-powered analysis. Without it, the system falls back to regex-based parsing.

---

## 6. Software Requirements

| Software | Version | Notes |
|----------|---------|-------|
| Node.js | ≥ 20 LTS | https://nodejs.org |
| npm | ≥ 9 | Comes with Node.js |
| Git | any | https://git-scm.com |

### ag-kit (Agent Framework)

This project uses [ag-kit](https://github.com/vudovn/ag-kit) for agent orchestration. Install it in the project root:

```bash
npx ag-kit install
```

> **SQLite:** Zero install — Prisma creates the database file automatically.
> **ChromaDB:** Not required for current implementation (similarity is computed locally).

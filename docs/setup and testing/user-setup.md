# User Setup Guide

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url>
cd pdlc-hackathon

# 2. Install all dependencies (workspaces handles backend & frontend)
npm install

# 3. Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys (see sections below)

# 4. Generate Prisma client and create the SQLite database
npm run db:push -w backend

# 5. Start the app (runs backend + frontend concurrently)
npm run dev
```

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

### Primary: Azure APIM (Hackathon Provided)

Edit `backend/.env` and replace the placeholder:

```env
LLM_PROVIDER=azure-apim
AZURE_APIM_BASE_URL=https://apim-foundry-prod-ltts.azure-api.net
AZURE_APIM_API_KEY=your_actual_team_key_here
AZURE_APIM_API_VERSION=2024-12-01-preview
LLM_MODEL=gpt-5.2
```

> **Important:** The hackathon provides a 2M token budget per team. Use this key ONLY for the application, not for IDE autocomplete.

### Fallback Options (If Budget Exhausted)

Uncomment one of these in `backend/.env`:

```env
# OpenAI Direct
# OPENAI_API_KEY=sk-...
# OPENAI_BASE_URL=https://api.openai.com/v1
```

---

## 3. Langfuse Observability (Optional but Recommended)

Langfuse provides real-time tracing of AI agent execution — critical for debugging and demo wow factor.

Langfuse Cloud is completely free to start and highly generous for developers. The Hobby (Free) Tier includes up to 50,000 observations (traces/spans) per month, which is sufficient for development, testing, and small hackathon projects without requiring a credit card.

**Step 1: Sign Up**
- Go to [cloud.langfuse.com](https://cloud.langfuse.com).
- Sign up using a Google account, GitHub account, or an email and password.

**Step 2: Create a Project**
- Log in to access your dashboard.
- Click the "New Project" button.
- Name your project (e.g., `pdlc-hackathon` or `TraceWise`) and click Create.

**Step 3: Generate API Keys**
- Click on **Settings** (the gear icon at the bottom left of the sidebar menu).
- Navigate to the **API Keys** tab.
- Click the "Create new API keys" button.
- Copy the Secret Key immediately, as it will be hidden once the modal closes.

**Step 4: Add the Keys to Your Code**
Paste the three generated pieces of information into your `backend/.env` file:

```env
LANGFUSE_PUBLIC_KEY=pk-lf-your_actual_key  # Starts with pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-your_actual_key  # Starts with sk-lf-...
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

> **Tip:** The system uses embedding-based similarity to match requirements to test cases, so exact keyword overlap isn't required.

---

## 5. Environment Variables Reference

All variables go in `backend/.env`:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LLM_PROVIDER` | No | `azure-apim` | LLM provider: `azure-apim` or `openai` |
| `AZURE_APIM_BASE_URL` | Yes* | — | Azure APIM gateway URL |
| `AZURE_APIM_API_KEY` | Yes* | — | Azure APIM authentication key |
| `AZURE_APIM_API_VERSION` | No | `2024-12-01-preview` | API version |
| `LLM_MODEL` | No | `gpt-5.2` | Model to use (gpt-5-mini, gpt-5.2, gpt-5.4, codex) |
| `OPENAI_API_KEY` | No | — | OpenAI direct fallback key |
| `OPENAI_BASE_URL` | No | `https://api.openai.com/v1` | OpenAI API base URL |
| `DATABASE_URL` | No | `file:./dev.db` | SQLite database path |
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

### SQLite (Relational Database)

Zero install — Prisma creates the database file automatically.

**Setup:** Run `npm run db:push -w backend` from the project root to generate the Prisma client and create the SQLite database.

**Accessing SQLite:**
- Browse and edit data via Prisma Studio: `npm run db:studio` (opens at `http://localhost:5555`)
- Or use [DB Browser for SQLite](https://sqlitebrowser.org/) to open `backend/dev.db` directly

# MiMoCode Session Notes - Skills Integration & Memory System

## Date: July 6, 2026

---

## 1. Using Skills from Open-Source Projects

### Problem
How to use skills from different open-source repositories (superpowers, ag-kit, gstack) across OpenCode and MiMoCode without separate setups.

### Solution: `.agents/skills/` Convention

MiMoCode automatically discovers skills from `.agents/skills/**/SKILL.md` - no configuration needed!

**Why this works:**
- Industry standard used by Claude Code, Codex, and other tools
- Project-specific (different projects can have different skills)
- Skills are version-controlled with the project
- Works across all MiMoCode/OpenCode compatible tools

### Repositories Analyzed

| Repository | Purpose | Skills Count | Integration Method |
|------------|---------|--------------|-------------------|
| [superpowers](https://github.com/obra/superpowers) | Development methodology | 14 skills | Copy to `.agents/skills/` |
| [ag-kit](https://github.com/vudovn/ag-kit) | Antigravity framework | 45 skills | Copy only `skills/` directory |
| [gstack](https://github.com/garrytan/gstack) | Claude Code setup | 23+ skills | Copy to `.agents/skills/` |

### Integration Commands

**For superpowers:**
```bash
git clone https://github.com/obra/superpowers.git .agents/superpowers
xcopy /E /I /Y ".agents\superpowers\skills\*" ".agents\skills\"
rmdir /S /Q ".agents\superpowers"
```

**For ag-kit (only copy skills, skip memory/workflows/MCP):**
```bash
git clone https://github.com/vudovn/ag-kit.git .agents/ag-kit
xcopy /E /I /Y ".agents\ag-kit\.agents\skills\*" ".agents\skills\"
rmdir /S /Q ".agents\ag-kit"
```

**For gstack:**
```bash
git clone https://github.com/garrytan/gstack.git .agents/gstack
xcopy /E /I /Y ".agents\gstack\skills\*" ".agents\skills\"
rmdir /S /Q ".agents\gstack"
```

### Key Insight: Skills vs Plugins

**Skills** = Markdown files (SKILL.md + YAML frontmatter)
- Discovered via glob patterns
- Injected into agent context as text
- No code execution

**Plugins** = TypeScript/JavaScript modules
- Provide runtime hooks
- Loaded via npm/git specs
- Execute as code with SDK access

Adding a plugin does NOT automatically make its skills visible!

### ag-kit Components Analysis

| Component | MiMoCode Equivalent | Should Integrate? |
|-----------|---------------------|-------------------|
| `skills/` | Auto-discovered from `.agents/skills/` | **YES** - portable |
| `memory/` | File-based memory system | **NO** - conflicts |
| `workflows/` | JavaScript workflow orchestration | **NO** - conflicts |
| `mcp_config.json` | MCP server support | **NO** - conflicts |
| `agent/` | Could add as instructions | Optional |
| `rules/` | Could add as instructions | Optional |

---

## 2. MiMoCode Memory System

### Storage Location

```
C:\Users\tmcha\.local\share\mimocode\memory\
```

### Directory Structure

```
memory/
├── global/
│   └── MEMORY.md                    # Global user preferences (cross-project)
├── projects/
│   └── <sha256-12-char>/           # Project-specific memory
│       └── MEMORY.md                # Durable project knowledge
└── sessions/
    └── ses_<id>/                    # Session-specific state
        ├── checkpoint.md            # Structured session state (11 sections)
        ├── notes.md                 # Free-form scratchpad
        └── tasks/
            └── <task-id>/
                └── progress.md      # Per-task journal
```

### Types of Memory

| Type | Location | Purpose | Persistence |
|------|----------|---------|-------------|
| **Global** | `global/MEMORY.md` | User preferences, cross-project rules | Forever |
| **Project** | `projects/<pid>/MEMORY.md` | Project context, architecture decisions | Forever |
| **Session Checkpoint** | `sessions/<sid>/checkpoint.md` | Structured session state | Per session |
| **Session Notes** | `sessions/<sid>/notes.md` | Free-form scratchpad | Per session |
| **Task Progress** | `sessions/<sid>/tasks/<id>/progress.md` | Task-specific journal | Per task |

### How Memory Loads

**Automatic during context rebuilds (not at session start):**

1. Session starts → Fresh context (0% used)
2. Work on features...
3. Context fills up (100%)
4. Rebuild triggered
5. MiMoCode loads:
   - Project MEMORY.md (knows your codebase)
   - Session checkpoint (recent work)
   - Global MEMORY.md (your preferences)
6. Continue with "memory" of your project

**What gets loaded automatically:**
- `projects/<pid>/MEMORY.md` (10K token budget)
- `global/MEMORY.md` (6K token budget)
- `sessions/<sid>/checkpoint.md` (11K token budget)
- `sessions/<sid>/notes.md` (6K token budget)

### Memory Access Pattern

**Two-tier strategy:**

**Tier 1: Automatic Full Injection (during rebuilds)**
When context overflows, the system injects:
- Project MEMORY.md (full content, budget-truncated)
- Global MEMORY.md (full content, budget-truncated)
- Session checkpoint (structured state)

**Tier 2: On-Demand FTS Search (during normal operation)**
The `memory` tool provides SQLite full-text search:
```bash
memory(operation: "search", query: "skill discovery")
```

### Multiple Sessions on Same Project

**Shared project memory, separate session checkpoints:**

```
projects/<pid>/MEMORY.md          ← Shared across ALL sessions
sessions/ses_001/checkpoint.md    ← Session 1 only
sessions/ses_002/checkpoint.md    ← Session 2 only
```

Session 1 learns something durable → checkpoint writer promotes it to project MEMORY.md → Session 2 automatically benefits.

### Global Memory Scope

**Global memory is per MiMoCode installation, not per project:**

- `global/MEMORY.md` = One file for ALL projects (user preferences, cross-project rules)
- `projects/<pid>/MEMORY.md` = Project-specific rules and decisions

---

## 3. Questions & Answers

### Q1: When I start a session, do I need to explicitly request project knowledge?

**A: No, it's automatic during context rebuilds.**

Memory is NOT loaded at session start. Instead, it's loaded when the context window fills up and triggers a "rebuild":

```
Session starts → Context fills up → Checkpoint rebuild triggered → Memory injected
```

### Q2: Does MiMoCode re-read the entire codebase each time?

**A: No, it uses a two-tier approach:**

1. **MEMORY.md summaries** - Compact project knowledge
2. **FTS search** - On-demand full-text search when needed
3. **Read tool** - For actual code file inspection

The system doesn't re-read your entire codebase. It relies on MEMORY.md summaries and targeted searches.

### Q3: How does multiple sessions on the same project work?

**A: Shared project memory, separate session checkpoints.**

- Project MEMORY.md persists across ALL sessions
- Each session has its own checkpoint.md
- Checkpoint writer extracts durable knowledge from sessions → updates project MEMORY.md

### Q4: Is global memory per project or per MiMoCode installation?

**A: Per MiMoCode installation.**

- `global/MEMORY.md` = One file for ALL projects
- `projects/<pid>/MEMORY.md` = Project-specific

### Q5: What resets vs persists when starting a new session?

**Resets:**
- Current conversation history
- Active tool outputs
- Working memory

**Persists:**
- Project MEMORY.md (learned codebase knowledge)
- Global MEMORY.md (your preferences)
- Session checkpoints (structured summaries)

---

## 4. Practical Benefits

### Feature Development Without Memory
- Re-explain project structure every session
- Re-describe coding patterns
- Re-state architectural decisions
- Waste tokens and time

### Feature Development With Memory
- MiMoCode knows your project structure
- Patterns remembered across features
- No re-explanation needed
- Each feature benefits from previous learning

### Where Memory Shines
1. **Onboarding new sessions** - No cold start
2. **Maintaining consistency** - Patterns remembered
3. **Avoiding repetition** - Don't re-explain context
4. **Building on past work** - Each feature benefits

---

## 5. Files Created/Modified This Session

### Project Files
- `.agents/skills/` - Contains 18 skill directories (4 original + 14 superpowers)
- `.agents/superpowers/` - Cloned and deleted (skills copied)
- `.agentic/` - Project context and conventions (unchanged)

### Global Files
- `~/.config/mimocode/mimocode.json` - Created then deleted (not needed with `.agents/skills/`)

### Memory Files
- `projects/global/MEMORY.md` - Updated with discovered knowledge
- `sessions/ses_0cc7319c9ffeT3Yas2ftpqKzhH/checkpoint.md` - Session state

---

## 6. Next Steps

### For This Project
1. Restart MiMoCode to verify skills appear
2. Test loading a superpowers skill: `use skill tool to load brainstorming`
3. Continue feature development

### For Future Projects
Copy `.agents/` and `.agentic/` folders to new projects:
```bash
xcopy /E /I ".agents" "new-project\.agents"
xcopy /E /I ".agentic" "new-project\.agentic"
```

Update `new-project\.agentic\PROJECT_CONTEXT.md` for the new project.

---

## 7. Key Takeaways

1. **`.agents/skills/` is the universal convention** - Works across MiMoCode, Claude Code, Codex
2. **Skills are portable** - Copy to any project, no configuration needed
3. **Memory is automatic** - Just work, and knowledge persists
4. **Project memory shared across sessions** - Learn once, benefit forever
5. **Global memory is per installation** - User preferences across all projects

---

*Session completed: July 6, 2026*

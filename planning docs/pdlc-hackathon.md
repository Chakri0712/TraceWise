# PDLC Hackathon Plan

**Project Type:** WEB (React/Angular + Node.js)
**Goal:** Build a prototype for "AI Across the Product Development Lifecycle" that finds traceability gaps between requirements and test cases.

## Answers to Your Questions

**1. What are the technologies needed here?**
*   **Frontend:** React (Next.js) or Angular.
*   **Backend:** Node.js (Express or NestJS).
*   **AI Orchestration:** LangGraph.js (for managing state and cyclic agent workflows) alongside LangChain.js.
*   **Storage:** A simple in-memory vector store (like LangChain's `MemoryVectorStore`) for the hackathon, or Pinecone/Chroma if you want persistence.
*   **Observability:** Langfuse (has a Node.js SDK and a great free tier).

**2. I think we need a good LLM and its API key right?**
*   **Yes.** While you can use free AI tools (like Claude Code or Copilot) to *write* the code, your actual Node.js application needs to call an LLM to perform the gap analysis.
*   **Free/Cheap Options:** Google Gemini offers a generous free tier for its API. OpenAI and Anthropic require a few dollars loaded into an API account.

**3. What kind of documents do we need as sample data?**
You need structured text files (Markdown is best) that contain deliberate gaps to prove your AI works:
*   **`requirements.md`**: "Req-1: Users must log in with email. Req-2: Users must log in with Google. Req-3: Dashboard must load in under 2 seconds."
*   **`test_cases.md`**: "Test-1: Verify email login works. Test-3: Verify dashboard load time."
*   *The "Wow Factor":* The AI should automatically flag that **Req-2 (Google Login)** has no corresponding test case.

**4. Do we have any agents/skills already here to handle development?**
Yes! Your `.agents/skills` folder is packed with tools. For this project, you should rely on:
*   `@[app-builder]`: To scaffold the initial React/Node project.
*   `@[frontend-architecture]` & `@[frontend-design]`: To build a fast, good-looking UI for uploading files and showing the traceability matrix.
*   `@[backend-specialist]`: To wire up the Node.js API endpoints and LangGraph.js state management logic.

**5. Can we rely on free models and free limits for complete development?**
*   **For writing the code:** Yes, the AI assistants (Copilot, etc.) are sufficient if you have good markdown plans (like this one).
*   **For running the app:** As mentioned in #2, you will need a valid API key (Gemini, OpenAI, or Anthropic) injected into your Node.js `.env` file so your app can function.

**6. If we use Java, Angular, and Python (same as compliance), will it reduce time?**
*   **Pros of reusing the stack:** If you literally clone the `compliance-core` (Java) and `confia_ai` (Python) repos and just modify the agents, it might save time on boilerplate (RabbitMQ setup, Langfuse integration, etc.).
*   **Cons for a Hackathon:** Java + Python Microservices with RabbitMQ is a very "heavy" architecture for a 24-48 hour hackathon. Node.js + React in a single monorepo will almost always be faster to iterate on from scratch.

---

## File Structure

```text
/pdlc-hackathon
  /frontend (React or Angular)
    /components (Upload UI, Traceability Dashboard)
  /backend (Node.js)
    /routes (API endpoints)
    /agents (LangGraph.js state machine and gap analysis logic)
```

## Task Breakdown

### Phase 1: Foundation (UI & API)
*   [ ] **Task 1:** Scaffold Frontend (React/Angular) with a simple layout. (Agent: `frontend-specialist`)
*   [ ] **Task 2:** Scaffold Node.js Backend with Express. (Agent: `backend-specialist`)
*   [ ] **Task 3:** Create a file upload endpoint in Node.js to receive `requirements.md` and `test_cases.md`. (Agent: `backend-specialist`)

### Phase 2: AI Integration
*   [ ] **Task 4:** Install LangGraph.js / LangChain.js and configure the LLM API Key in Node.js. (Agent: `backend-specialist`)
*   [ ] **Task 5:** Build the `TraceabilityGraph` logic: A LangGraph `StateGraph` that manages the back-and-forth between extracting requirements, parsing test cases, and evaluating gaps, outputting a JSON array. (Agent: `backend-specialist`)
*   [ ] **Task 6:** Integrate Langfuse for observability to trace the graph execution and LLM calls. (Agent: `backend-specialist`)

### Phase 3: Visualization & Polish
*   [ ] **Task 7:** Build a Frontend dashboard to display the JSON output as a red/green Traceability Matrix. (Agent: `frontend-specialist`)
*   [ ] **Task 8:** Add sample documents (`requirements.md`, `test_cases.md`) to the repository for the demo. (Agent: `project-planner`)

## Phase X: Verification
- [ ] Lint: ✅ Pass
- [ ] Security: ✅ No exposed API keys
- [ ] Build: ✅ Success
- [ ] Demo: ✅ Successfully flags a missing test case from sample data

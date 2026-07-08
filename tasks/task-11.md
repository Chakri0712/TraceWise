# Task 11: Integrate Langfuse Observability

**Status:** Complete

## What Was Done
Integrated Langfuse for tracing and monitoring all LLM calls across the agent pipeline. Each agent emits trace spans for observability.

## Files Created
- `backend/src/langfuse.ts` — Langfuse client singleton with lazy initialization

## Files Modified
- `backend/src/agents/requirement-refiner.ts` — Added Langfuse trace spans
- `backend/src/agents/test-case-generator.ts` — Added Langfuse trace spans
- `backend/src/agents/report-generator.ts` — Added Langfuse trace spans + flush
- `backend/src/routes/analyze.ts` — Generates traceId, returns langfuseUrl

## Trace Structure
```
Trace (per run)
  ├─ RequirementRefiner → callLLM span
  ├─ TestCaseGenerator → callLLM span
  ├─ TraceabilityAgent → analyze span
  └─ ReportGenerator → generatePDF span
```

## Key Decisions
- Graceful degradation: works without Langfuse configured (returns null)
- Auto-flush on report generation completion
- traceId included in API response for direct Langfuse dashboard link

## Verification
- App loads with Langfuse integration
- Without keys: warnings logged, pipeline still works
- With keys: traces visible in Langfuse dashboard

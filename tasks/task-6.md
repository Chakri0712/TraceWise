# Task 6: Implement TestCaseGenerator + TraceabilityAgent

**Status:** Complete

## What Was Done
Implemented the test case generator (generates test cases from requirements via LLM) and traceability agent (compares uploaded test cases against requirements using similarity matching).

## Files Created
- `backend/src/agents/test-case-generator.ts` — Both agents + similarity function

## TestCaseGenerator
- Sends requirements to GPT-4o requesting linked test cases
- Falls back to keyword-based generation (login/performance/export)
- Generates 1-2 test cases per requirement

## TraceabilityAgent
- Compares ONLY uploaded test cases against requirements (not generated ones)
- Three-tier similarity: exact word match, stem/prefix match, synonym dictionary
- Threshold: 0.2 (catches semantic relationships like "login" ↔ "log in")
- Outputs: matches[], gaps[], coverage%

## Key Decisions
- Only uploaded test cases count toward coverage (generated ones fill gaps)
- Similarity includes semantic synonyms for QA terminology
- Coverage shows 50% with sample data (2/4 requirements covered)

## Verification
- Pipeline test: coverage 50%, gaps for Req-2 and Req-4
- Similarity debug: Req-1 ↔ Test-1 matches at 20%, Req-3 ↔ Test-2 at 56%

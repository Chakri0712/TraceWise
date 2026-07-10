# Jury Q&A Notes — Hackathon Defense

## Q1: Backwards Compatibility — What if test cases exist without matching requirements?

### The Problem

In real-world PDLC workflows, test cases often arrive without corresponding requirements:
- A QA team writes test cases based on domain knowledge before requirements are finalized
- Requirements get deleted or refactored, but test cases still reference the old IDs
- Partial uploads — only test cases are uploaded without a requirements document

### Current Behavior

The existing `traceabilityAgent` performs **one-directional matching**:
- For each requirement, it finds the best matching test case via embedding similarity or word-level fallback
- Unmatched requirements are flagged as **gaps** (no test coverage)
- Test cases that don't match any requirement are silently ignored — they don't appear in the report at all

### Recommended Solution: Bidirectional Traceability

Extend the existing `traceabilityAgent` (no new agent needed) with reverse matching:

**Forward pass** (existing):
```
For each requirement → find best matching test case → gap if none
```

**Reverse pass** (new):
```
For each test case → find best matching requirement → orphan if none
```

**Implementation:**
1. Add `orphanTestCases: TestCase[]` to `AgentState` in `state.ts`
2. Add reverse loop in `traceabilityAgent()` in `test-case-generator.ts` (~30 lines)
3. Add "Orphan Test Cases" section to the HTML report in `report-generator.ts`

**Why not a new agent?**
- The traceability logic is one analysis concern, not two separate workflows
- All data (requirements, testCases, embeddings) is already in state
- Adding a LangGraph node means another LLM/embedding call for a simple loop reversal
- Keeps the pipeline at 4 nodes — simpler to reason about and debug

### Coverage Report Enhancement

The report should show three categories:
1. **Covered requirements** — requirements with matching test cases
2. **Uncovered requirements (gaps)** — requirements with no test case coverage
3. **Orphan test cases** — test cases with no linked requirement

This gives a complete traceability picture in both directions.

---

## Q2: Cross-Domain Extensibility — EV, Mechanical, Civil, Payments?

### The Insight

The core system is already **domain-agnostic**. The markdown parser handles any text, the LLM extracts structured requirements from any domain, and the traceability engine computes similarity regardless of content. What changes per domain is the **template** and **coverage rules**.

### Domain Comparison

| Aspect | Software | EV / Electrical | Mechanical | Civil | Payments |
|--------|----------|-----------------|------------|-------|----------|
| Requirement format | "User must be able to..." | "Battery must sustain 80% at -20C" | "Spindle must maintain 0.005mm tolerance" | "Bridge must withstand 5.0 magnitude seismic" | "Transaction must complete within 300ms" |
| Test case format | Unit/Integration/System/Acceptance | Physical test / Simulation / Compliance | Bench test / Stress test / Inspection | Load test / Site inspection / Audit | Functional / Security / Performance / Compliance |
| Standards | IEEE 829, ISO 26262 | IEC 62660, ISO 26262 | ISO 2768, ASME Y14.5 | ACI 318, AASHTO LRFD | PCI-DSS, SOX, PSD2 |
| Coverage metrics | Code coverage % | Compliance + safety coverage | Tolerance + lifecycle coverage | Structural + regulatory coverage | Transaction + fraud coverage |

### What Needs to Change for Domain Support

1. **Domain-specific templates** — Pre-built markdown templates with domain-appropriate sections:
   - Software: Functional, Non-Functional, Security
   - EV: Powertrain, Battery, Thermal Management, Safety, Regulatory
   - Mechanical: Tolerance, Material, Lifecycle, Safety
   - Civil: Structural, Environmental, Load-Bearing, Regulatory
   - Payments: Transaction Processing, Security, Fraud, Regulatory

2. **Domain-specific test case levels** — The current 4-level model (Unit/Integration/System/Acceptance) maps well to software but needs adaptation:
   - EV: Component Test → Integration Test → Vehicle Test → Type Approval
   - Mechanical: Bench Test → Subsystem Test → Full Machine Test → Acceptance
   - Civil: Material Test → Element Test → System Test → Commissioning
   - Payments: Functional Test → Security Test → Performance Test → Compliance Audit

3. **Domain-specific coverage rules** — Add standard/registry mapping:
   - Each requirement can reference a standard (e.g., "Req-14 → IEC 62660-3 Section 5.2")
   - Coverage analysis checks not just "is there a test?" but "does the test cover the standard?"

4. **The multi-format output becomes a compliance artifact** — In regulated industries (automotive, aerospace, construction, banking), auditors require traceability documents. The PDF/TXT/DOCX output pipeline we built is exactly what auditors ask for.

### Architecture Summary

```
Domain Template (markdown)
    ↓
 parsers/index.ts (already generic — reads any .md/.txt/.pdf/.docx)
    ↓
 requirementRefiner (LLM extracts structured requirements — domain-agnostic)
    ↓
 testCaseGenerator (LLM generates domain-appropriate test cases via prompt)
    ↓
 traceabilityAgent (embedding similarity — domain-agnostic)
    ↓
 reportGenerator (HTML → PDF — domain-agnostic)
```

The only domain-specific piece is the **prompt** in `testCaseGenerator` — and that's already parameterized by the requirements text. The LLM naturally adapts its test case generation to the domain of the input requirements.

### Key Takeaway for the Jury

This is a **requirements traceability engine** that uses markdown as its universal interchange format. The domain is a configuration layer, not a code change. Swap the template, and the entire pipeline works the same way. For an EV example: upload `ev-requirements.md` and `ev-test_cases.md`, and the system produces the same coverage analysis with EV-specific content.

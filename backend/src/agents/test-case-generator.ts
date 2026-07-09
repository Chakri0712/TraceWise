import type { AgentState, TestCase, Gap, Requirement } from './state.js';
import { getLangfuse } from '../langfuse.js';
import { callLLM, callEmbeddings } from '../llm-client.js';

export async function testCaseGenerator(state: AgentState): Promise<Partial<AgentState>> {
  console.log('[TestCaseGenerator] Generating test cases from requirements...');

  const { requirements } = state;
  if (requirements.length === 0) {
    console.log('[TestCaseGenerator] No requirements to generate tests for');
    return { generatedTestCases: [] };
  }

  const reqList = requirements.map(r => `${r.id}: ${r.text}`).join('\n');

  const prompt = `You are an expert Test Manager. Generate a comprehensive and highly realistic suite of test cases for the following requirements. 

For each requirement, you MUST generate distinct test cases covering different testing levels, ensuring each test case matches the target testing focus of its level:
- **Unit Testing:** Focus on testing raw logic, single functions, inputs/outputs, parameter constraints, helper methods, data validation rules, regex checks, and password hash computations.
- **Integration Testing:** Focus on verifying API endpoint requests and responses, database CRUD operations, index lookups, session states, mapping mechanisms, and communication with third-party service gateways (e.g. Google OAuth, Stripe sandbox).
- **System Testing:** Focus on end-to-end user scenarios simulated in the web browser user interface (UI), complete user navigation flows, multi-filter catalog interactions, shopping cart total recalculations on page, and full checkout sequences.
- **Acceptance Testing:** Focus on user experience SLAs (e.g., page load under 2 seconds), regulatory compliance requirements (e.g., GDPR data portability/erasure rights), and business transaction verification (e.g. verifying order receipt enqueued after card processing).

Do NOT repeat the requirement text. Make each test case description highly specific, realistic, and segregated according to the target level focus described above.

Requirements:
${reqList}

Return ONLY a JSON array with this exact format:
[
  { "id": "TC-1", "text": "specific Unit level test case description", "requirementId": "Req-1", "type": "Unit" },
  { "id": "TC-2", "text": "specific Integration level test case description", "requirementId": "Req-1", "type": "Integration" },
  { "id": "TC-3", "text": "specific System level test case description", "requirementId": "Req-1", "type": "System" },
  { "id": "TC-4", "text": "specific Acceptance level test case description", "requirementId": "Req-1", "type": "Acceptance" }
]

Rules:
- For each requirement, generate distinct test cases covering: 'Unit', 'Integration', 'System', and 'Acceptance' testing levels.
- Each test case must specify its type: 'Unit', 'Integration', 'System', or 'Acceptance'.
- Each test case must link to a requirement via requirementId.
- Test cases should be specific and verifiable.
- Return ONLY the JSON array, no other text`;

  let generatedTestCases: TestCase[];
  try {
    console.log('[TestCaseGenerator] Calling LLM...');
    const response = await callLLM(prompt);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in LLM response');
    }
    generatedTestCases = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('[TestCaseGenerator] LLM failed, generating basic test cases:', e);
    generatedTestCases = generateTestCasesFallback(requirements);
  }

  console.log(`[TestCaseGenerator] Generated ${generatedTestCases.length} test cases`);
  return { generatedTestCases };
}

function generateTestCasesFallback(requirements: Requirement[]): TestCase[] {
  const testCases: TestCase[] = [];
  let tcNum = 1;

  for (const req of requirements) {
    const text = req.text;
    const keywords = text.toLowerCase();

    // 1. Unit Testing
    let unitDesc = `Unit: Validate input validation parameter constraints, data types, and local functions for requirement: "${text}"`;
    if (keywords.includes('login') || keywords.includes('register') || keywords.includes('auth')) {
      unitDesc = `Unit: Test sign-in/signup input validators (validate email format regex, password length constraints, and token parser output).`;
    } else if (keywords.includes('load') || keywords.includes('performance') || keywords.includes('users')) {
      unitDesc = `Unit: Test connection pool sizing config, counter arithmetic thread-safety, and latency calculation helper utilities.`;
    } else if (keywords.includes('export') || keywords.includes('download') || keywords.includes('pdf')) {
      unitDesc = `Unit: Verify PDF report template parser functions inject data correctly and respect boundary limits.`;
    } else if (keywords.includes('gdpr') || keywords.includes('eu')) {
      unitDesc = `Unit: Verify PII detection functions correctly mask fields and cascade deletion handles related records in SQLite.`;
    } else if (keywords.includes('bcrypt') || keywords.includes('password')) {
      unitDesc = `Unit: Assert password hashing utility uses configured salt rounds and validates matching inputs correctly.`;
    } else if (keywords.includes('filter') || keywords.includes('catalog')) {
      unitDesc = `Unit: Test custom filtering filterCatalogItems function returns expected array slice given mock product inputs.`;
    } else if (keywords.includes('cart') || keywords.includes('quantity')) {
      unitDesc = `Unit: Verify local cart state modifiers (addItem, changeQty, removeItem) correctly calculate item totals.`;
    } else if (keywords.includes('checkout') || keywords.includes('pay')) {
      unitDesc = `Unit: Verify transaction calculation methods compute tax, shipping, and total amounts accurately.`;
    }
    testCases.push({ id: `TC-${tcNum++}`, text: unitDesc, requirementId: req.id, type: 'Unit' });

    // 2. Integration Testing
    let intDesc = `Integration: Verify API endpoints, database operations, and service integrations for requirement: "${text}"`;
    if (keywords.includes('login') || keywords.includes('register') || keywords.includes('auth')) {
      intDesc = `Integration: Assert register API endpoint creates DB user record, locks unique constraint, and authenticates session.`;
    } else if (keywords.includes('load') || keywords.includes('performance') || keywords.includes('users')) {
      intDesc = `Integration: Perform DB index and connection load checks under load to verify catalog retrieval stays within thresholds.`;
    } else if (keywords.includes('export') || keywords.includes('download') || keywords.includes('pdf')) {
      intDesc = `Integration: Ensure PDF generation route integrates with reports folder, saves file, and serves download stream.`;
    } else if (keywords.includes('gdpr') || keywords.includes('eu')) {
      intDesc = `Integration: Confirm deletion request API successfully triggers data deletion across users, telemetry, and logging tables.`;
    } else if (keywords.includes('bcrypt') || keywords.includes('password')) {
      intDesc = `Integration: Confirm user creation API stores password column only as hashed bcrypt format in the database.`;
    } else if (keywords.includes('filter') || keywords.includes('catalog')) {
      intDesc = `Integration: Verify catalog retrieval API handles filter query params and utilizes DB search indexing correctly.`;
    } else if (keywords.includes('cart') || keywords.includes('quantity')) {
      intDesc = `Integration: Verify cart update API persists changes to database/session and aligns product availability indices.`;
    } else if (keywords.includes('checkout') || keywords.includes('pay')) {
      intDesc = `Integration: Verify communication with sandbox payment gateway endpoints and update order status in DB to 'paid'.`;
    }
    testCases.push({ id: `TC-${tcNum++}`, text: intDesc, requirementId: req.id, type: 'Integration' });

    // 3. System Testing
    let sysDesc = `System: Verify complete end-to-end user browser interactions and UI logic for requirement: "${text}"`;
    if (keywords.includes('login') || keywords.includes('register') || keywords.includes('auth')) {
      sysDesc = `System: Complete registration and OAuth login in the browser UI, ensuring dashboard redirect and navigation state update.`;
    } else if (keywords.includes('load') || keywords.includes('performance') || keywords.includes('users')) {
      sysDesc = `System: Run automated stress tests simulating 1000 users browsing, shopping, and paying simultaneously to verify SLA.`;
    } else if (keywords.includes('export') || keywords.includes('download') || keywords.includes('pdf')) {
      sysDesc = `System: Trigger export from dashboard UI, download generated PDF, and verify layout elements and content accuracy.`;
    } else if (keywords.includes('gdpr') || keywords.includes('eu')) {
      sysDesc = `System: Verify cookie banner presents GDPR options, and requesting data export/deletion clears browser cookie and DB data.`;
    } else if (keywords.includes('bcrypt') || keywords.includes('password')) {
      sysDesc = `System: Perform password update flow in the user portal and confirm login works immediately using new password.`;
    } else if (keywords.includes('filter') || keywords.includes('catalog')) {
      sysDesc = `System: Verify multi-filter catalog UI dynamically updates product results matching selected category, price, and rating.`;
    } else if (keywords.includes('cart') || keywords.includes('quantity')) {
      sysDesc = `System: Add products to cart in browser, update quantities, remove items, and confirm displayed totals update dynamically.`;
    } else if (keywords.includes('checkout') || keywords.includes('pay')) {
      sysDesc = `System: Complete checkout flow using credit card and PayPal options, verify payment state changes, and redirect to confirmation.`;
    }
    testCases.push({ id: `TC-${tcNum++}`, text: sysDesc, requirementId: req.id, type: 'System' });

    // 4. Acceptance Testing
    let accDesc = `Acceptance: Verify business rules, customer SLAs, and regulatory compliance criteria for: "${text}"`;
    if (keywords.includes('login') || keywords.includes('register') || keywords.includes('auth')) {
      accDesc = `Acceptance: Verify business criteria: user can register and sign in seamlessly via email or external providers without manual assistance.`;
    } else if (keywords.includes('load') || keywords.includes('performance') || keywords.includes('users')) {
      accDesc = `Acceptance: Verify performance SLA: product catalog page load time is under 2 seconds for standard client browser configurations.`;
    } else if (keywords.includes('export') || keywords.includes('download') || keywords.includes('pdf')) {
      accDesc = `Acceptance: Verify export criteria: report downloads as a valid PDF file matching corporate layout standards.`;
    } else if (keywords.includes('gdpr') || keywords.includes('eu')) {
      accDesc = `Acceptance: Verify compliance criteria: EU users can exercise privacy rights (access, portability, deletion) easily within SLA.`;
    } else if (keywords.includes('bcrypt') || keywords.includes('password')) {
      accDesc = `Acceptance: Verify security compliance: passwords must be hashed securely meeting industry standards (bcrypt with salt).`;
    } else if (keywords.includes('filter') || keywords.includes('catalog')) {
      accDesc = `Acceptance: Verify user experience criteria: category, price range, and rating filters return expected results as per PM specification.`;
    } else if (keywords.includes('cart') || keywords.includes('quantity')) {
      accDesc = `Acceptance: Verify retail business criteria: shoppers can add/modify items in cart and checkout with correct subtotals.`;
    } else if (keywords.includes('checkout') || keywords.includes('pay')) {
      accDesc = `Acceptance: Verify payment gateway criteria: order transaction succeeds and confirmation email is sent upon credit card/PayPal completion.`;
    }
    testCases.push({ id: `TC-${tcNum++}`, text: accDesc, requirementId: req.id, type: 'Acceptance' });
  }

  return testCases;
}

export async function traceabilityAgent(state: AgentState): Promise<Partial<AgentState>> {
  console.log('[Traceability] Analyzing test coverage...');

  const langfuse = getLangfuse();
  const trace = langfuse?.trace({ id: state.traceId, name: 'TraceabilityAgent' });
  const span = trace?.span({ name: 'analyze' });

  const { requirements, testCases } = state;

  // Compute embeddings for uploaded test cases if not already present
  let testCaseEmbeddings = { ...state.testCaseEmbeddings };
  for (const tc of testCases) {
    if (!testCaseEmbeddings[tc.id]) {
      try {
        testCaseEmbeddings[tc.id] = await callEmbeddings(tc.text);
      } catch (e) {
        console.warn(`[Traceability] Embedding failed for ${tc.id}:`, e);
      }
    }
  }

  const hasEmbeddings = Object.keys(state.requirementEmbeddings).length > 0
    && Object.keys(testCaseEmbeddings).length > 0;

  console.log(`[Traceability] Using ${hasEmbeddings ? 'embedding-based' : 'word-level'} similarity`);

  // Only match UPLOADED test cases (not generated ones)
  const matches: { requirementId: string; testCaseId: string; similarity: number }[] = [];
  const coveredReqIds = new Set<string>();

  for (const req of requirements) {
    let bestMatch: { testCaseId: string; similarity: number } | null = null;

    for (const tc of testCases) {
      let similarity: number;

      if (hasEmbeddings && state.requirementEmbeddings[req.id] && testCaseEmbeddings[tc.id]) {
        similarity = cosineSimilarity(state.requirementEmbeddings[req.id], testCaseEmbeddings[tc.id]);
      } else {
        similarity = calculateSimilarity(req.text, tc.text);
      }

      const threshold = hasEmbeddings ? 0.6 : 0.2;
      if (similarity >= threshold) {
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = { testCaseId: tc.id, similarity };
        }
      }
    }

    if (bestMatch) {
      matches.push({
        requirementId: req.id,
        testCaseId: bestMatch.testCaseId,
        similarity: bestMatch.similarity,
      });
      coveredReqIds.add(req.id);
    }
  }

  const gaps: Gap[] = requirements
    .filter(r => !coveredReqIds.has(r.id))
    .map(r => ({
      requirementId: r.id,
      reason: `No test case found covering: ${r.text}`,
      suggestedTest: `Verify: ${r.text}`,
    }));

  // Reverse pass: detect orphan test cases (test cases with no matching requirement)
  const matchedTestIds = new Set(matches.map(m => m.testCaseId));
  const orphanTestCases: TestCase[] = testCases.filter(tc => !matchedTestIds.has(tc.id));

  const coverage = requirements.length > 0
    ? (coveredReqIds.size / requirements.length) * 100
    : 0;

  console.log(`[Traceability] Coverage: ${coverage.toFixed(0)}% (${coveredReqIds.size}/${requirements.length})`);
  console.log(`[Traceability] Gaps found: ${gaps.length}`);
  console.log(`[Traceability] Orphan test cases: ${orphanTestCases.length}`);

  span?.end({
    output: {
      coverage,
      matchedCount: matches.length,
      gapCount: gaps.length,
      orphanCount: orphanTestCases.length,
      method: hasEmbeddings ? 'embedding' : 'word-level',
    },
  });

  return { matches, gaps, coverage, testCaseEmbeddings, orphanTestCases };
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : Math.max(0, dot / denom);
}

function calculateSimilarity(text1: string, text2: string): number {
  const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const getWords = (text: string) => normalize(text).split(/\s+/).filter(w => w.length > 2);

  const words1 = getWords(text1);
  const words2 = getWords(text2);
  const set1 = new Set(words1);
  const set2 = new Set(words2);

  // Direct word matches
  const directMatches = [...set1].filter(w => set2.has(w)).length;

  // Stem-like matching (login matches log, exports matches export, etc.)
  let stemMatches = 0;
  for (const w1 of set1) {
    for (const w2 of set2) {
      if (w1 !== w2 && (w1.startsWith(w2) || w2.startsWith(w1)) && Math.min(w1.length, w2.length) >= 4) {
        stemMatches++;
        break;
      }
    }
  }

  // Semantic keyword matches
  const synonyms: [string, string][] = [
    ['login', 'log'], ['sign', 'login'], ['authenticate', 'login'],
    ['password', 'credential'], ['export', 'download'], ['pdf', 'report'],
    ['load', 'performance'], ['fast', 'performance'], ['seconds', 'time'],
    ['verify', 'test'], ['check', 'test'], ['ensure', 'test'],
    ['user', 'users'], ['must', 'should'], ['email', 'credential'],
  ];

  let semanticMatches = 0;
  for (const [word1, word2] of synonyms) {
    if ((set1.has(word1) && set2.has(word2)) || (set1.has(word2) && set2.has(word1))) {
      semanticMatches++;
    }
  }

  const totalMatches = directMatches + stemMatches + semanticMatches;
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) return 0;
  return Math.min(totalMatches / union.size, 1);
}

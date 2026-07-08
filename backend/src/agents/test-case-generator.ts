import type { AgentState, TestCase, Gap, Requirement } from './state.js';
import { getLangfuse } from '../langfuse.js';

const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2025-04-01-preview';

async function callLLM(prompt: string, traceId?: string, agentName?: string): Promise<string> {
  if (!AZURE_ENDPOINT || !AZURE_KEY) {
    throw new Error('LLM not configured');
  }

  const langfuse = getLangfuse();
  const trace = langfuse?.trace({ id: traceId, name: agentName || 'TestCaseGenerator' });
  const span = trace?.span({ name: 'callLLM' });

  const url = `${AZURE_ENDPOINT}/chat/completions?api-version=${AZURE_VERSION}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': AZURE_KEY,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    span?.end({ statusMessage: `Error: ${res.status}` });
    throw new Error(`LLM API error ${res.status}: ${err}`);
  }

  const data = await res.json() as { choices: { message: { content: string } }[] };
  const content = data.choices[0].message.content;

  span?.end({ output: { model: 'gpt-4o', tokens: content.length } });
  return content;
}

export async function testCaseGenerator(state: AgentState): Promise<Partial<AgentState>> {
  console.log('[TestCaseGenerator] Generating test cases from requirements...');

  const { requirements } = state;
  if (requirements.length === 0) {
    console.log('[TestCaseGenerator] No requirements to generate tests for');
    return { generatedTestCases: [] };
  }

  const reqList = requirements.map(r => `${r.id}: ${r.text}`).join('\n');

  const prompt = `You are a QA engineer. Generate test cases for the following requirements.

Requirements:
${reqList}

Return ONLY a JSON array with this exact format:
[
  { "id": "TC-1", "text": "test case description", "requirementId": "Req-1" },
  { "id": "TC-2", "text": "test case description", "requirementId": "Req-2" }
]

Rules:
- Generate 1-2 test cases per requirement
- Each test case must link to a requirement via requirementId
- Test cases should be specific and verifiable
- Return ONLY the JSON array, no other text`;

  let generatedTestCases: TestCase[];
  try {
    console.log('[TestCaseGenerator] Calling LLM...');
    const response = await callLLM(prompt, state.traceId, 'TestCaseGenerator');
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
    const keywords = req.text.toLowerCase();
    const isLogin = keywords.includes('login') || keywords.includes('sign in');
    const isPerformance = keywords.includes('load') || keywords.includes('under') || keywords.includes('seconds');
    const isExport = keywords.includes('export') || keywords.includes('download') || keywords.includes('pdf');

    if (isLogin) {
      testCases.push({
        id: `TC-${tcNum++}`,
        text: `Verify user can authenticate successfully for: ${req.text}`,
        requirementId: req.id,
      });
    } else if (isPerformance) {
      testCases.push({
        id: `TC-${tcNum++}`,
        text: `Verify performance requirement meets threshold: ${req.text}`,
        requirementId: req.id,
      });
    } else if (isExport) {
      testCases.push({
        id: `TC-${tcNum++}`,
        text: `Verify export functionality works correctly: ${req.text}`,
        requirementId: req.id,
      });
    } else {
      testCases.push({
        id: `TC-${tcNum++}`,
        text: `Verify requirement is implemented correctly: ${req.text}`,
        requirementId: req.id,
      });
    }
  }

  return testCases;
}

export async function traceabilityAgent(state: AgentState): Promise<Partial<AgentState>> {
  console.log('[Traceability] Analyzing test coverage...');

  const langfuse = getLangfuse();
  const trace = langfuse?.trace({ id: state.traceId, name: 'TraceabilityAgent' });
  const span = trace?.span({ name: 'analyze' });

  const { requirements, testCases } = state;

  // Only match UPLOADED test cases (not generated ones)
  const matches: { requirementId: string; testCaseId: string; similarity: number }[] = [];
  const coveredReqIds = new Set<string>();

  for (const req of requirements) {
    let bestMatch: { testCaseId: string; similarity: number } | null = null;

    for (const tc of testCases) {
      const similarity = calculateSimilarity(req.text, tc.text);

      if (similarity >= 0.2) {
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

  const coverage = requirements.length > 0
    ? (coveredReqIds.size / requirements.length) * 100
    : 0;

  console.log(`[Traceability] Coverage: ${coverage.toFixed(0)}% (${coveredReqIds.size}/${requirements.length})`);
  console.log(`[Traceability] Gaps found: ${gaps.length}`);

  span?.end({
    output: {
      coverage,
      matchedCount: matches.length,
      gapCount: gaps.length,
    },
  });

  return { matches, gaps, coverage };
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

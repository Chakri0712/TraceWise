import type { AgentState, Requirement, TestCase } from './state.js';
import { getLangfuse } from '../langfuse.js';

const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT!;
const AZURE_KEY = process.env.AZURE_OPENAI_API_KEY!;
const AZURE_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2025-04-01-preview';

async function callLLM(prompt: string, traceId?: string): Promise<string> {
  const langfuse = getLangfuse();
  const span = langfuse?.trace({ id: traceId, name: 'RequirementRefiner-LLM' })?.span({ name: 'callLLM' });

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

export async function requirementRefiner(state: AgentState): Promise<Partial<AgentState>> {
  console.log('[RequirementRefiner] Processing documents...');
  const traceId = state.traceId;

  // Parse requirements
  const reqDocs = state.documents.filter(d =>
    d.filename.toLowerCase().includes('req')
  );

  let requirements: Requirement[] = [];
  if (reqDocs.length > 0) {
    const combinedContent = reqDocs.map(d => `--- ${d.filename} ---\n${d.content}`).join('\n\n');

    const prompt = `You are a requirements analyst. Parse the following requirement document and extract structured requirements.

Return ONLY a JSON array with this exact format:
[
  { "id": "Req-1", "text": "requirement description", "priority": "high" },
  { "id": "Req-2", "text": "requirement description", "priority": "medium" }
]

Rules:
- Each requirement gets a unique ID (Req-1, Req-2, etc.)
- Text should be the full requirement description
- Priority: high, medium, or low (infer from context if not explicit)
- If requirements already have IDs, keep them
- Return ONLY the JSON array, no other text

Requirements document:
${combinedContent}`;

    console.log('[RequirementRefiner] Calling LLM to structure requirements...');

    try {
      const response = await callLLM(prompt, traceId);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in LLM response');
      }
      requirements = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('[RequirementRefiner] LLM call failed, falling back to regex parsing:', e);
      requirements = parseRequirementsFallback(combinedContent);
    }
  }

  // Parse test cases from test documents
  const testDocs = state.documents.filter(d =>
    d.filename.toLowerCase().includes('test')
  );

  let testCases: TestCase[] = [];
  if (testDocs.length > 0) {
    const testContent = testDocs.map(d => d.content).join('\n\n');
    testCases = parseTestCasesFallback(testContent);
  }

  console.log(`[RequirementRefiner] Found ${requirements.length} requirements, ${testCases.length} test cases`);
  return { requirements, testCases };
}

function parseRequirementsFallback(content: string): Requirement[] {
  const requirements: Requirement[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/(?:Req-\d+|Requirement\s+\d+)[\s:：-]+\s*(.+)/i)
      || line.match(/^[-*]\s*((?:Req-\d+|Requirement\s+\d+)[\s:：-]+)/i);

    if (match) {
      const idMatch = line.match(/(Req-\d+|Requirement\s+\d+)/i);
      const id = idMatch ? idMatch[1].replace(/\s+/g, '-') : `Req-${requirements.length + 1}`;
      const text = line.replace(/^[-*]\s*/, '').trim();
      requirements.push({ id, text });
    }
  }

  return requirements;
}

function parseTestCasesFallback(content: string): TestCase[] {
  const testCases: TestCase[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/(?:Test-\d+|TC-\d+|Test\s+Case\s+\d+)[\s:：-]+\s*(.+)/i)
      || line.match(/^[-*]\s*((?:Test-\d+|TC-\d+|Test\s+Case\s+\d+)[\s:：-]+)/i);

    if (match) {
      const idMatch = line.match(/(Test-\d+|TC-\d+|Test\s+Case\s+\d+)/i);
      const id = idMatch ? idMatch[1].replace(/\s+/g, '-') : `TC-${testCases.length + 1}`;
      const text = line.replace(/^[-*]\s*/, '').trim();
      testCases.push({ id, text });
    }
  }

  return testCases;
}

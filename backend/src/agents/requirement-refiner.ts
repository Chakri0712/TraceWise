import type { AgentState, Requirement, TestCase } from './state.js';
import { callLLM, callEmbeddings } from '../llm-client.js';

export async function requirementRefiner(state: AgentState): Promise<Partial<AgentState>> {
  console.log('[RequirementRefiner] Processing documents...');

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
      const response = await callLLM(prompt);
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

  // Compute embeddings for requirements
  const requirementEmbeddings: Record<string, number[]> = {};
  for (const req of requirements) {
    try {
      requirementEmbeddings[req.id] = await callEmbeddings(req.text);
    } catch (e) {
      console.warn(`[RequirementRefiner] Embedding failed for ${req.id}, will use fallback matching:`, e);
    }
  }
  console.log(`[RequirementRefiner] Computed ${Object.keys(requirementEmbeddings).length}/${requirements.length} requirement embeddings`);

  return { requirements, testCases, requirementEmbeddings };
}

function parseRequirementsFallback(content: string): Requirement[] {
  const requirements: Requirement[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/(?:Req-\d+|Requirement\s+\d+)[\s:：]+\s*(.+)/i)
      || line.match(/^[-*]\s*((?:Req-\d+|Requirement\s+\d+)[\s:：]+)\s*(.+)/i);

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
    const match = line.match(/(?:Test-\d+|TC-\d+|Test\s+Case\s+\d+)[\s:：]+\s*(.+)/i)
      || line.match(/^[-*]\s*((?:Test-\d+|TC-\d+|Test\s+Case\s+\d+)[\s:：]+)\s*(.+)/i);

    if (match) {
      const idMatch = line.match(/(Test-\d+|TC-\d+|Test\s+Case\s+\d+)/i);
      const id = idMatch ? idMatch[1].replace(/\s+/g, '-') : `TC-${testCases.length + 1}`;
      const text = line.replace(/^[-*]\s*/, '').trim();
      testCases.push({ id, text });
    }
  }

  return testCases;
}

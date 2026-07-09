import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import { graph } from './src/agents/graph.js';
import type { AgentState } from './src/agents/state.js';

dotenv.config();

async function main() {
  const reqContent = readFileSync(join(import.meta.dirname, 'sample/requirements.md'), 'utf-8');
  const testContent = readFileSync(join(import.meta.dirname, 'sample/test_cases.md'), 'utf-8');

  const initialState: AgentState = {
    runId: 'test-run-1',
    documents: [
      { filename: 'requirements.md', type: 'markdown', content: reqContent },
      { filename: 'test_cases.md', type: 'markdown', content: testContent },
    ],
    requirements: [],
    testCases: [],
    generatedTestCases: [],
    requirementEmbeddings: {},
    testCaseEmbeddings: {},
    matches: [],
    gaps: [],
    coverage: 0,
  };

  console.log('=== Running Full Agent Pipeline ===\n');

  const result = await graph.invoke(initialState);

  console.log('\n=== Results ===');
  console.log(`Requirements: ${result.requirements.length}`);
  result.requirements.forEach(r => console.log(`  ${r.id}: ${r.text}`));

  console.log(`\nGenerated Test Cases: ${result.generatedTestCases.length}`);
  result.generatedTestCases.forEach(tc => console.log(`  ${tc.id} [${tc.type || '—'}]: ${tc.text}`));

  console.log(`\nMatches: ${result.matches.length}`);
  result.matches.forEach(m => console.log(`  ${m.requirementId} -> ${m.testCaseId} (${(m.similarity * 100).toFixed(0)}%)`));

  console.log(`\nGaps: ${result.gaps.length}`);
  result.gaps.forEach(g => console.log(`  ${g.requirementId}: ${g.reason}`));

  console.log(`\nCoverage: ${result.coverage.toFixed(0)}%`);
}

main().catch(console.error);

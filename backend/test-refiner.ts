import { readFileSync } from 'fs';
import { join } from 'path';
import { requirementRefiner } from './src/agents/requirement-refiner.js';
import type { AgentState } from './src/agents/state.js';

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
    matches: [],
    gaps: [],
    coverage: 0,
  };

  console.log('=== Testing RequirementRefinerAgent ===\n');
  console.log('Input documents:');
  initialState.documents.forEach(d => console.log(`  - ${d.filename}`));

  const result = await requirementRefiner(initialState);

  console.log('\nExtracted requirements:');
  result.requirements?.forEach(r => {
    console.log(`  ${r.id}: ${r.text}`);
    if (r.priority) console.log(`    Priority: ${r.priority}`);
  });

  console.log(`\nTotal: ${result.requirements?.length || 0} requirements`);
}

main().catch(console.error);

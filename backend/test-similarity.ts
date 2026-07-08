import { readFileSync } from 'fs';
import { join } from 'path';
import { graph } from './src/agents/graph.js';
import type { AgentState } from './src/agents/state.js';

// Debug similarity
function calculateSimilarity(text1: string, text2: string): number {
  const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const getWords = (text: string) => normalize(text).split(/\s+/).filter(w => w.length > 2);

  const words1 = getWords(text1);
  const words2 = getWords(text2);
  const set1 = new Set(words1);
  const set2 = new Set(words2);

  console.log(`  Words1: ${[...set1].join(', ')}`);
  console.log(`  Words2: ${[...set2].join(', ')}`);

  // Direct word matches
  const directMatches = [...set1].filter(w => set2.has(w));
  console.log(`  Direct matches: ${directMatches.join(', ')}`);

  // Stem-like matching
  const stemMatches: string[] = [];
  for (const w1 of set1) {
    for (const w2 of set2) {
      if (w1 !== w2 && (w1.startsWith(w2) || w2.startsWith(w1)) && Math.min(w1.length, w2.length) >= 4) {
        stemMatches.push(`${w1}~${w2}`);
        break;
      }
    }
  }
  console.log(`  Stem matches: ${stemMatches.join(', ')}`);

  // Semantic keyword matches
  const synonyms: [string, string][] = [
    ['login', 'log'], ['sign', 'login'], ['authenticate', 'login'],
    ['password', 'credential'], ['export', 'download'], ['pdf', 'report'],
    ['load', 'performance'], ['fast', 'performance'], ['seconds', 'time'],
    ['verify', 'test'], ['check', 'test'], ['ensure', 'test'],
    ['user', 'users'], ['must', 'should'], ['email', 'credential'],
  ];

  const semanticMatches: string[] = [];
  for (const [word1, word2] of synonyms) {
    if ((set1.has(word1) && set2.has(word2)) || (set1.has(word2) && set2.has(word1))) {
      semanticMatches.push(`${word1}~${word2}`);
    }
  }
  console.log(`  Semantic matches: ${semanticMatches.join(', ')}`);

  const totalMatches = directMatches.length + stemMatches.length + semanticMatches.length;
  const union = new Set([...set1, ...set2]);
  const score = union.size === 0 ? 0 : Math.min(totalMatches / union.size, 1);
  console.log(`  Score: ${totalMatches}/${union.size} = ${score.toFixed(3)}`);

  return score;
}

async function main() {
  const reqContent = readFileSync(join(import.meta.dirname, 'sample/requirements.md'), 'utf-8');
  const testContent = readFileSync(join(import.meta.dirname, 'sample/test_cases.md'), 'utf-8');

  // Debug similarity for each pair
  console.log('=== Debug Similarity ===\n');

  const reqs = [
    'Req-1: Users must log in with email and password.',
    'Req-2: Users must log in with Google OAuth.',
    'Req-3: Dashboard must load in under 2 seconds.',
    'Req-4: Users must be able to export reports as PDF.',
  ];

  const tests = [
    'Test-1: Verify email/password login succeeds with valid credentials.',
    'Test-2: Verify dashboard load time is under 2 seconds.',
  ];

  for (const req of reqs) {
    for (const test of tests) {
      console.log(`Comparing:`);
      console.log(`  Req: ${req}`);
      console.log(`  Test: ${test}`);
      calculateSimilarity(req, test);
      console.log('');
    }
  }
}

main().catch(console.error);

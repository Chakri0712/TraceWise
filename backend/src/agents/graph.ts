import { StateGraph, Annotation } from '@langchain/langgraph';
import type { AgentState } from './state.js';
import { requirementRefiner } from './requirement-refiner.js';
import { testCaseGenerator, traceabilityAgent } from './test-case-generator.js';
import { reportGenerator } from './report-generator.js';

const StateAnnotation = Annotation.Root({
  runId: Annotation<string>,
  documents: Annotation<{ filename: string; type: string; content: string }[]>,
  requirements: Annotation<{ id: string; text: string; priority?: string }[]>,
  testCases: Annotation<{ id: string; text: string; requirementId?: string }[]>,
  generatedTestCases: Annotation<{ id: string; text: string; requirementId?: string }[]>,
  matches: Annotation<{ requirementId: string; testCaseId: string; similarity: number }[]>,
  gaps: Annotation<{ requirementId: string; reason: string; suggestedTest?: string }[]>,
  coverage: Annotation<number>,
  reportPath: Annotation<string | undefined>,
  traceId: Annotation<string | undefined>,
});

const graph = new StateGraph(StateAnnotation)
  .addNode('requirementRefiner', requirementRefiner)
  .addNode('testCaseGenerator', testCaseGenerator)
  .addNode('traceability', traceabilityAgent)
  .addNode('reportGenerator', reportGenerator)
  .addEdge('__start__', 'requirementRefiner')
  .addEdge('requirementRefiner', 'testCaseGenerator')
  .addEdge('testCaseGenerator', 'traceability')
  .addEdge('traceability', 'reportGenerator')
  .addEdge('reportGenerator', '__end__')
  .compile();

export { graph, type AgentState };

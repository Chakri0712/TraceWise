export interface Requirement {
  id: string;
  text: string;
  priority?: string;
}

export interface TestCase {
  id: string;
  text: string;
  requirementId?: string;
  type?: string;
}

export interface Gap {
  requirementId: string;
  reason: string;
  suggestedTest?: string;
}

export interface AgentState {
  runId: string;
  documents: { filename: string; type: string; content: string }[];
  requirements: Requirement[];
  testCases: TestCase[];
  generatedTestCases: TestCase[];
  requirementEmbeddings: Record<string, number[]>;
  testCaseEmbeddings: Record<string, number[]>;
  matches: { requirementId: string; testCaseId: string; similarity: number }[];
  gaps: Gap[];
  orphanTestCases: TestCase[];
  coverage: number;
  reportPath?: string;
  traceId?: string;
}

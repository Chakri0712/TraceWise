import { useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef, Suspense } from 'react';

interface Requirement {
  id: string;
  text: string;
  priority?: string;
}

interface TestCase {
  id: string;
  text: string;
  requirementId?: string;
  type?: string;
}

interface Match {
  requirementId: string;
  testCaseId: string;
  similarity: number;
}

interface Gap {
  requirementId: string;
  reason: string;
  suggestedTest?: string;
}

interface AnalysisResult {
  runId: string;
  status: string;
  coverage: number;
  requirements: Requirement[];
  testCases: TestCase[];
  generatedTestCases: TestCase[];
  matches: Match[];
  gaps: Gap[];
  reportPath?: string;
}

function DashboardContent() {
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('runId');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const analysisTriggered = useRef(false);

  useEffect(() => {
    if (!runId || analysisTriggered.current) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/results/${runId}`);
        const data = await res.json();

        if (data.status === 'completed' && data.coverage !== null) {
          setResult(data);
          setLoading(false);
        } else if (data.status === 'uploaded') {
          analysisTriggered.current = true;
          setAnalyzing(true);
          const fullRes = await fetch(`/api/analyze/${runId}`, { method: 'POST' });
          if (fullRes.ok) {
            const fullData = await fullRes.json();
            setResult(fullData);
            setAnalyzing(false);
            setLoading(false);
          }
        }
      } catch (e) {
        console.error('Failed to fetch results:', e);
        setLoading(false);
      }
    };

    checkStatus();
  }, [runId]);

  if (!runId) {
    return (
      <div className="container">
        <div className="card">
          <h2>No run selected</h2>
          <p>Go back to upload files first.</p>
          <a href="/" className="btn btn-primary">Upload Files</a>
        </div>
      </div>
    );
  }

  if (loading || analyzing) {
    return (
      <div className="container">
        <div className="card loading">
          <div className="spinner"></div>
          <h2>{analyzing ? 'Analyzing documents...' : 'Loading results...'}</h2>
          <p>This may take a few seconds.</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="container">
        <div className="card">
          <h2>Analysis failed</h2>
          <p>Could not load results. Please try again.</p>
          <a href="/" className="btn btn-primary">Upload Files</a>
        </div>
      </div>
    );
  }

  const coveredCount = result.requirements.length - result.gaps.length;

  return (
    <div>
      <header>
        <h1>PDLC Dashboard</h1>
        <a href="/" className="btn btn-secondary">New Analysis</a>
      </header>
      <main className="container">
        <div className="summary-cards">
          <div className="stat-card">
            <div className="stat-value" style={{ color: result.coverage >= 50 ? '#2e7d32' : '#c62828' }}>
              {result.coverage.toFixed(0)}%
            </div>
            <div className="stat-label">Coverage</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{result.requirements.length}</div>
            <div className="stat-label">Requirements</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{result.testCases.length}</div>
            <div className="stat-label">Test Cases</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#c62828' }}>{result.gaps.length}</div>
            <div className="stat-label">Gaps</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Traceability Matrix</h2>
            <a href={`/api/report/${runId}`} className="btn btn-primary" target="_blank">
              Download PDF Report
            </a>
          </div>
          <table className="matrix">
            <thead>
              <tr>
                <th>Requirement</th>
                <th>Linked Test Case</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {result.requirements.map(req => {
                const match = result.matches.find(m => m.requirementId === req.id);
                return (
                  <tr key={req.id}>
                    <td>{req.id}: {req.text}</td>
                    <td>{match ? match.testCaseId : '—'}</td>
                    <td className={match ? 'covered' : 'missing'}>
                      {match ? '✅ Covered' : '❌ MISSING'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {result.gaps.length > 0 && (
          <div className="card">
            <h2>Coverage Gaps</h2>
            <div className="gaps-list">
              {result.gaps.map(gap => (
                <div key={gap.requirementId} className="gap-item">
                  <div className="gap-req">{gap.requirementId}</div>
                  <div>{gap.reason}</div>
                  {gap.suggestedTest && (
                    <div className="gap-suggested">Suggested: {gap.suggestedTest}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <h2>AI-Generated Test Cases</h2>
          <table className="matrix">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Description</th>
                <th>For Requirement</th>
              </tr>
            </thead>
            <tbody>
              {result.generatedTestCases.map(tc => (
                <tr key={tc.id}>
                  <td>{tc.id}</td>
                  <td><strong>{tc.type || '—'}</strong></td>
                  <td>{tc.text}</td>
                  <td>{tc.requirementId || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="container"><div className="card loading"><div className="spinner"></div><h2>Loading...</h2></div></div>}>
      <DashboardContent />
    </Suspense>
  );
}

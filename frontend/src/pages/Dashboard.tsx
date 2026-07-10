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
  orphanTestCases: TestCase[];
  reportPath?: string;
}

function DashboardContent() {
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('runId');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const analysisTriggered = useRef(false);
  const [selectedType, setSelectedType] = useState('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!runId || analysisTriggered.current) return;

    // Set synchronously immediately to prevent double-firing in React 18 Strict Mode
    analysisTriggered.current = true;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/results/${runId}`);
        const data = await res.json();

        if (data.status === 'completed' && data.coverage !== null) {
          setResult(data);
          setLoading(false);
        } else if (data.status === 'uploaded') {
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
            <div className="stat-value" style={{ color: 'var(--color-error)' }}>
              {result.coverage.toFixed(0)}%
            </div>
            <div className="stat-label">Coverage</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#15ac15' }}>{result.requirements.length}</div>
            <div className="stat-label">Requirements</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#15ac15' }}>{result.testCases.length}</div>
            <div className="stat-label">Test Cases</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-error)' }}>{result.gaps.length}</div>
            <div className="stat-label">Gaps</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#e65100' }}>{(result.orphanTestCases || []).length}</div>
            <div className="stat-label">Orphan Test Cases</div>
          </div>
        </div>
        <a style={{ marginBottom: "25px" }} href={`/api/report/${runId}`} className="btn btn-primary" target="_blank">
          Download PDF Report
        </a>
        <div className="card">
          <div className="card-header">
            <h2 style={{ whiteSpace: "nowrap", fontSize: "24px", fontWeight: "bold" }}>Traceability Matrix</h2>

          </div>
          <table className="matrix">
            <thead>
              <tr>
                <th style={{ whiteSpace: "nowrap" }}>Requirement</th>
                <th style={{ whiteSpace: "nowrap" }}>Linked Test Case</th>
                <th style={{ whiteSpace: "nowrap" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {result.requirements.map(req => {
                const match = result.matches.find(m => m.requirementId === req.id);
                return (
                  <tr key={req.id}>
                    <td style={{ fontWeight: "500" }} ><span style={{ fontWeight: "700" }}>{req.id}</span>: {req.text}</td>
                    <td style={{ fontWeight: "500" }}>{match ? match.testCaseId : 'NA'}</td>
                    <td style={{ fontWeight: "500" }} className={match ? 'covered' : 'missing'}>
                      {match ? '✅ Covered' : '❌ Missing'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {result.gaps.length > 0 && (
          <div className="card">
            <h2 style={{ whiteSpace: "nowrap", fontSize: "24px", fontWeight: "bold" }}>Coverage Gaps</h2>
            <div className="gaps-list">
              {result.gaps.map(gap => (
                <div key={gap.requirementId} className="gap-item">
                  <div className="gap-req">{gap.requirementId}</div>
                  <div style={{ fontSize: "16px", fontWeight: "bold" }}>{gap.reason}</div>
                  {gap.suggestedTest && (
                    <div className="gap-suggested"><span style={{ color: "#15ac15" }}>Suggested: </span>{gap.suggestedTest}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(result.orphanTestCases || []).length > 0 && (
          <div className="card">
            <h2 style={{ whiteSpace: "nowrap", fontSize: "24px", fontWeight: "bold" }}>Orphan Test Cases (No Linked Requirement)</h2>
            <div className="gaps-list">
              {result.orphanTestCases.map(tc => (
                <div key={tc.id} className="gap-item" style={{ background: '#fff8e1', borderLeftColor: '#e65100' }}>
                  <div className="gap-req" style={{ color: '#e65100' }}>{tc.id}</div>
                  <div>{tc.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(() => {
          const uniqueTypes = ['All', ...Array.from(new Set(result.generatedTestCases.map(tc => tc.type || 'NA')))];
          const filteredTestCases = result.generatedTestCases.filter(tc => selectedType === 'All' || (tc.type || 'NA') === selectedType);

          return (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ whiteSpace: "nowrap", fontSize: "24px", fontWeight: "bold", margin: 0 }}>AI-Generated Test Cases</h2>
                <div className="custom-dropdown-container">
                  <button
                    className="dropdown-toggle"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    Filter by Type: {selectedType}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  {isDropdownOpen && (
                    <ul className="dropdown-menu">
                      {uniqueTypes.map(type => (
                        <li
                          key={type}
                          className={selectedType === type ? 'active' : ''}
                          onClick={() => {
                            setSelectedType(type);
                            setIsDropdownOpen(false);
                          }}
                        >
                          {type}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <table className="matrix">
                <thead>
                  <tr>
                    <th style={{ whiteSpace: "nowrap" }}>ID</th>
                    <th style={{ whiteSpace: "nowrap" }}>Type</th>
                    <th style={{ whiteSpace: "nowrap" }}>Description</th>
                    <th style={{ whiteSpace: "nowrap" }}>For Requirement</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTestCases.map(tc => (
                    <tr key={tc.id}>
                      <td style={{ whiteSpace: "nowrap", fontWeight: "500" }}>{tc.id}</td>
                      <td style={{ whiteSpace: "nowrap", fontWeight: "500" }}>{tc.type || 'NA'}</td>
                      <td style={{ fontWeight: "500" }}>{tc.text}</td>
                      <td style={{ whiteSpace: "nowrap", fontWeight: "500" }}>{tc.requirementId || 'NA'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
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

import { useState, useRef } from 'react';
import aiRobotLaptop from '../images/ai-robot-laptop.jpg';
import aiBotImages from '../images/ai-bot-images.png';
import { useNavigate } from 'react-router-dom';
import aiLaptop from '../images/ai-laptop.jpg';

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ['md', 'pdf', 'txt', 'docx'].includes(ext || '');
    });

    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.runId) {
        navigate(`/dashboard?runId=${data.runId}`);
      }
    } catch (e) {
      console.error('Upload failed:', e);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const scrollToUpload = () => {
    document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <a href="/" className="navbar-brand">
          <div className="navbar-logo">T</div>
          <span className="navbar-title">Tracewise AI</span>
        </a>
        {/* <div className="navbar-meta">
          <span style={{ color: "#ffffff", fontSize: "15px", fontWeight: "500" }}><span className="navbar-dot" /> Online</span>
        </div> */}
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span>Tracewise AI</span>
          </div>
          <div className="hero-title-container">
            <img src={aiBotImages} alt="Left Abstract Orb" className="hero-img-left floating-img" />
            <h1>
              AI-Powered<br />
              Requirement-to-Test <em>Traceability</em>
            </h1>
            <img src={aiLaptop} alt="Right Abstract Cube" className="hero-img-right floating-img" />
          </div>
          <p style={{ color: "#ffffff", fontSize: "18px" }}>
            Upload your requirements and test cases. Our 4-agent pipeline
            identifies coverage gaps, generates missing tests, and delivers
            a full traceability report in minutes.
          </p>
          <button className="hero-cta" onClick={scrollToUpload}>
            Get Started
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v10M3 8l5 5 5-5" />
            </svg>
          </button>
        </div>
      </section>

      {/* How It Works */}
      <section className="section">
        <div className="section-inner">
          <div className="section-label">How It Works</div>
          <h2 className="section-title">From documents to insights in three steps</h2>
          <p className="section-desc">
            Our AI agents handle the heavy lifting so you can focus on building.
          </p>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Upload Documents</h3>
              <p>Drag and drop your requirements and test case files. We support Markdown, PDF, Word, and plain text.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>AI Analysis</h3>
              <p>Four specialized agents parse, generate, match, and analyze using LLM + embedding-based semantic similarity.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Get Your Report</h3>
              <p>Receive a coverage report with traceability matrix, gap analysis, and AI-generated test case suggestions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section section-alt">
        <div className="section-inner">
          <div className="section-label">The Pipeline</div>
          <h2 className="section-title">Four agents working in sequence</h2>
          <p className="section-desc">
            Each agent handles one stage of the analysis pipeline, connected via LangGraph for reliable state management.
          </p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h3>Requirement Refiner</h3>
              <p>Parses raw documents into structured requirements with embeddings for semantic matching.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <h3>Test Case Generator</h3>
              <p>Generates targeted test cases for each requirement using LLM-powered analysis.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h3>Traceability Agent</h3>
              <p>Matches requirements to test cases using cosine similarity on 1536-dim embeddings.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon orange">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M12 18v-6" />
                  <path d="M9 15l3 3 3-3" />
                </svg>
              </div>
              <h3>Report Generator</h3>
              <p>Renders a styled HTML report and converts it to a downloadable PDF via Puppeteer.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="section" id="upload-section">
        <div className="section-inner">
          <div className="upload-wrapper">
            <div className="upload-card">
              <h2 style={{ fontSize: "32px" }}>Upload Documents</h2>
              <p className="subtitle">Add your requirements and test case files to begin analysis.</p>

              <div
                className={`dropzone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept=".md,.pdf,.txt,.docx"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <div className="dropzone-content">
                  <div className="dropzone-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4361ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className="dropzone-text">Drag and drop files here, or click to browse</p>
                  <p className="dropzone-hint">Supports .md, .pdf, .txt, .docx</p>
                </div>
              </div>

              {files.length > 0 && (
                <div className="file-list">
                  <h3>Selected Files</h3>
                  {files.map((f, i) => (
                    <div key={i} className="file-item">
                      <span>{f.name}</span>
                      <button onClick={() => removeFile(i)} className="btn-remove">&times;</button>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload & Analyze'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <span>Tracewise AI</span>
        <span>AI Across the Product Development Lifecycle</span>
      </footer>
    </div>
  );
}

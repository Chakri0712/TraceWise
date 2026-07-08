'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
        router.push(`/dashboard?runId=${data.runId}`);
      }
    } catch (e) {
      console.error('Upload failed:', e);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <header>
        <h1>PDLC Dashboard</h1>
      </header>
      <main className="container">
        <div className="card">
          <h2>Upload Documents</h2>
          <p className="subtitle">Upload your requirements and test case documents to begin analysis.</p>

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
              <span className="dropzone-icon">📄</span>
              <p>Drag & drop files here or click to browse</p>
              <p className="dropzone-hint">Supports: .md, .pdf, .txt, .docx</p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="file-list">
              <h3>Selected Files</h3>
              {files.map((f, i) => (
                <div key={i} className="file-item">
                  <span>{f.name}</span>
                  <button onClick={() => removeFile(i)} className="btn-remove">×</button>
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
      </main>
    </div>
  );
}

import React, { useCallback, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { api } from '../api/client';
import { useSessionStore } from '../store/sessionStore';

export default function FileUploader({ onUploadComplete }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const { setSessionId, setTopic } = useSessionStore();

  const ALLOWED = ['application/pdf', 'text/plain'];
  const ALLOWED_EXT = ['.pdf', '.txt'];

  const validateFile = (f) => {
    if (!f) return 'No file selected.';
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) return 'Only PDF and TXT files are supported.';
    if (f.size > 20 * 1024 * 1024) return 'File too large. Max size is 20 MB.';
    return '';
  };

  const pickFile = (f) => {
    const err = validateFile(f);
    setError(err);
    if (!err) setFile(f);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) pickFile(droppedFile);
  }, []);

  const handleBrowse = (e) => {
    const chosen = e.target.files[0];
    if (chosen) pickFile(chosen);
  };

  const submitFile = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    setError('');

    // Simulate progress while waiting (real progress needs XHR/axios onUploadProgress)
    const ticker = setInterval(() => {
      setUploadProgress((p) => (p < 85 ? p + 5 : p));
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('topic', file.name.split('.')[0]);

      const res = await api.uploadFile(formData);
      clearInterval(ticker);
      setUploadProgress(100);

      setSessionId(res.data.session_id);
      setTopic(res.data.topic || file.name.split('.')[0]);
      onUploadComplete({ id: res.data.session_id, name: file.name, keywords: res.data.keywords });
    } catch (err) {
      clearInterval(ticker);
      setUploadProgress(0);
      const detail = err?.response?.data?.detail || 'Upload failed. Please try again.';
      setError(detail);
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const fileSizeMB = file ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

      {/* Drop zone — also clickable */}
      <div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? 'var(--primary)' : error ? '#e53e3e' : 'var(--border)'}`,
          backgroundColor: isDragging ? 'var(--bg-primary)' : 'transparent',
          padding: '3rem 2rem',
          borderRadius: '12px',
          textAlign: 'center',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          width: '100%',
          transition: 'all 0.2s',
          marginBottom: '1rem',
        }}
      >
        <UploadCloud
          size={48}
          color={isDragging ? 'var(--primary)' : error ? '#e53e3e' : 'var(--text-light)'}
          style={{ marginBottom: '1rem' }}
        />
        <h4 style={{ margin: '0 0 0.5rem 0' }}>
          {file ? file.name : 'Drag & Drop or Click to Browse'}
        </h4>
        <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.9rem' }}>
          {file ? fileSizeMB : 'Supported formats: PDF, TXT · Max 20 MB'}
        </p>

        {/* Hidden native file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          style={{ display: 'none' }}
          onChange={handleBrowse}
        />
      </div>

      {/* Error message */}
      {error && (
        <p style={{ color: '#e53e3e', fontSize: '0.85rem', margin: '0 0 0.75rem 0', alignSelf: 'flex-start' }}>
          ⚠ {error}
        </p>
      )}

      {/* Upload progress bar */}
      {isUploading && (
        <div style={{ width: '100%', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '4px' }}>
            <span>Uploading & analyzing…</span>
            <span>{uploadProgress}%</span>
          </div>
          <div style={{ height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px' }}>
            <div
              style={{
                height: '100%',
                width: `${uploadProgress}%`,
                backgroundColor: 'var(--primary)',
                borderRadius: '3px',
                transition: 'width 0.2s',
              }}
            />
          </div>
        </div>
      )}

      {/* Submit button */}
      {file && !isUploading && (
        <button
          className="btn-primary"
          onClick={submitFile}
          style={{ width: '100%', marginTop: '0.5rem' }}
        >
          Start Learning
        </button>
      )}

      {isUploading && (
        <button
          className="btn-primary"
          disabled
          style={{ width: '100%', marginTop: '0.5rem', opacity: 0.7, cursor: 'not-allowed' }}
        >
          Processing…
        </button>
      )}
    </div>
  );
}

import React, { useRef, useState } from 'react';
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

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) pickFile(droppedFile);
  };

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
    <div className="uploader-shell">

      {/* Drop zone — also clickable */}
      <div
        className={`uploader-dropzone ${isDragging ? 'is-dragging' : ''} ${error ? 'has-error' : ''} ${file ? 'has-file' : ''}`}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="uploader-dropzone__icon-wrap">
          <UploadCloud
            size={32}
            color={isDragging ? 'var(--primary)' : error ? '#b42318' : 'var(--primary)'}
          />
        </div>
        <h4 className="uploader-dropzone__title">
          {file ? file.name : 'Drag & drop your file here'}
        </h4>
        <p className="uploader-dropzone__subtitle">
          {file ? fileSizeMB : 'Or click to browse your device'}
        </p>
        <p className="uploader-dropzone__meta">
          Supported: PDF, TXT · Max 20 MB
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
        <p style={{ color: '#b42318', fontSize: '0.9rem', margin: '0 0 0.75rem 0', alignSelf: 'flex-start' }}>
          ⚠ {error}
        </p>
      )}

      {/* Upload progress bar */}
      {isUploading && (
        <div className="uploader-progress">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-light)', marginBottom: '6px' }}>
            <span>Uploading & analyzing…</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="uploader-progress__track">
            <div
              className="uploader-progress__bar"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit button */}
      {file && !isUploading && (
        <button
          className="btn-primary uploader-action"
          onClick={submitFile}
        >
          Start Learning
        </button>
      )}

      {isUploading && (
        <button
          className="btn-primary uploader-action"
          disabled
        >
          Processing…
        </button>
      )}
    </div>
  );
}

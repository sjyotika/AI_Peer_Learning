import React from 'react';
import FileUploader from '../components/FileUploader';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';

export default function UploadPage() {
  const navigate = useNavigate();
  const { setUploadedDocument, isAuthenticated } = useSessionStore();

  const handleUploadComplete = (fileData) => {
    setUploadedDocument(fileData);
    if (isAuthenticated) {
      navigate('/explain');
    } else {
      navigate('/signin');
    }
  };

  return (
    <div style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Main Content Area */}
      <div style={{ maxWidth: '1200px', width: '100%', margin: '6rem auto 8rem auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '6rem', alignItems: 'center', padding: '0 2rem' }}>
        
        {/* Left Side: Hero Section */}
        <header>
          <div style={{ display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: 'var(--primary-light, #ece9ff)', color: 'var(--primary)', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            New: GPT-4o Integration
          </div>
          <h1 style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1.05, margin: '0 0 1.5rem 0', letterSpacing: '-0.02em', color: 'var(--text-dark)' }}>
            Transform your<br/>notes into<br/>
            <span style={{ color: 'var(--primary)', fontStyle: 'italic', paddingRight: '0.5rem' }}>knowledge.</span>
          </h1>
          <p style={{ color: 'var(--text-light)', fontSize: '1.25rem', lineHeight: 1.6, maxWidth: '90%', marginBottom: '2.5rem' }}>
            Upload your physics documents and let LearnPeer build your personalized study roadmap using state-of-the-art AI evaluation models.
          </p>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-dark)' }}>4x</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px' }}>Faster Learning</span>
            </div>
            <div style={{ width: '1px', height: '40px', backgroundColor: 'var(--border)' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-dark)' }}>98%</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px' }}>Concept Accuracy</span>
            </div>
          </div>
        </header>

        {/* Right Side: Upload Section */}
        <div style={{ backgroundColor: '#ffffff', padding: '3rem', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light, #ece9ff)', padding: '0.5rem', borderRadius: '8px' }}>upload_file</span>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)' }}>
              REFERENCE MATERIAL
            </div>
          </div>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-light)', marginBottom: '2rem', lineHeight: 1.5 }}>
            Upload PDF notes, slides, or textbook excerpts to generate a tailored session.
          </p>
          <FileUploader onUploadComplete={handleUploadComplete} />
        </div>

      </div>

      {/* Footer spans full width at the bottom */}
      <Footer />
      
    </div>
  );
}

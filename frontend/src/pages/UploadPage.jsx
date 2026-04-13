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
    <div className="upload-page">
      <div className="upload-page__backdrop" />
      <main className="upload-page__content">
        <section className="upload-hero">
          <div className="upload-hero__eyebrow">AI Learning Studio</div>
          <h1 className="upload-hero__title">
            “Learn by Teaching.
            <br />
            Grow by Thinking.”
          </h1>
          <p className="upload-hero__description">
            LearnPeer turns your material into a guided Socratic learning session with feedback, follow-up questions, and a final concept report.
          </p>

          <div className="upload-hero__metrics">
            <div>
              <strong>Guided</strong>
              <span>Socratic flow</span>
            </div>
            <div>
              <strong>Focused</strong>
              <span>Concept coverage</span>
            </div>
            <div>
              <strong>Clear</strong>
              <span>Final report</span>
            </div>
          </div>
        </section>

        <aside className="upload-panel">
          <div className="upload-panel__header">
            <div className="upload-panel__icon">upload_file</div>
            <div>
              <div className="upload-panel__eyebrow">Reference Material</div>
              <h2 className="upload-panel__title">Start with a document</h2>
            </div>
          </div>
          <p className="upload-panel__description">
            Upload PDF notes, slides, or textbook excerpts. LearnPeer will extract concepts, ask focused questions, and build your report.
          </p>

          <div className="upload-panel__steps">
            <div>
              <span>1</span>
              <p>Upload your document</p>
            </div>
            <div>
              <span>2</span>
              <p>Review Socratic questions</p>
            </div>
            <div>
              <span>3</span>
              <p>Receive a concept report</p>
            </div>
          </div>

          <FileUploader onUploadComplete={handleUploadComplete} />
        </aside>
      </main>

      <Footer />
    </div>
  );
}

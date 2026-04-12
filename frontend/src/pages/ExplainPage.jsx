import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { Mic, Send } from 'lucide-react';
import { api } from '../api/client';

export default function ExplainPage() {
  const navigate = useNavigate();
  const { topic, sessionId, addChatMessage } = useSessionStore();
  const [explanation, setExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submitExplanation = async () => {
    const text = explanation.trim();
    if (!text) return;
    if (text.length < 20) {
      setError('Please provide a more detailed explanation (at least 20 characters).');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const res = await api.submitExplanation({
        session_id: sessionId,
        explanation_text: text,
      });

      const { ai_message, is_done } = res.data;
      addChatMessage({ role: 'assistant', content: ai_message });

      if (is_done) {
        // Great explanation — skip Q&A, go directly to report
        navigate('/report');
      } else {
        navigate('/chat');
      }
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Could not submit explanation. Please try again.';
      setError(detail);
      console.error('Explain error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Learning Session</h2>
          <p style={{ color: 'var(--text-light)', margin: 0 }}>Topic: {topic}</p>
        </div>
        <button
          className="btn-primary"
          style={{ backgroundColor: 'var(--danger)' }}
          onClick={() => navigate('/report')}
        >
          End Session
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Instructions */}
        <div className="card-wrapper" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'none' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>auto_awesome</span>
            Task Instructions
          </h4>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Explain the concept of <strong>{topic || 'the uploaded material'}</strong> in your own words.
            You can type it out or use voice recording. The AI peer will analyse your explanation
            and ask Socratic questions to probe your understanding.
          </p>
          <ul style={{ color: 'var(--text-light)', fontSize: '0.85rem', lineHeight: 1.8, paddingLeft: '1.25rem' }}>
            <li>Be as detailed as possible — cover definitions, mechanisms, and examples.</li>
            <li>Use your own words, not copy-pasted text.</li>
            <li>After submitting, you will answer the AI's follow-up questions.</li>
          </ul>
        </div>

        {/* Explanation input */}
        <div className="card-wrapper">
          <h4 style={{ marginBottom: '1rem' }}>Your Explanation</h4>

          <button style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '0.5rem 1rem', border: '1px solid var(--border)',
            borderRadius: '4px', background: 'transparent', cursor: 'pointer', marginBottom: '1rem',
          }}>
            <Mic size={16} /> Start Recording
          </button>

          <textarea
            placeholder="Or type your explanation here…"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '1rem',
              borderRadius: '4px',
              border: `1px solid ${error ? '#e53e3e' : 'var(--border)'}`,
              fontFamily: 'inherit',
              resize: 'vertical',
              marginBottom: '0.5rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {error && (
            <p style={{ color: '#e53e3e', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>⚠ {error}</p>
          )}

          <button
            className="btn-primary"
            onClick={submitExplanation}
            disabled={!explanation.trim() || isSubmitting}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              opacity: (!explanation.trim() || isSubmitting) ? 0.6 : 1,
              cursor: (!explanation.trim() || isSubmitting) ? 'not-allowed' : 'pointer',
            }}
          >
            <Send size={16} />
            {isSubmitting ? 'Submitting…' : 'Submit Explanation'}
          </button>
        </div>
      </div>
    </div>
  );
}

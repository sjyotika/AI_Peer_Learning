import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import ChatWindow from '../components/ChatWindow';
import { Mic, MicOff, Send } from 'lucide-react';
import { api } from '../api/client';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

export default function AIPeerPage() {
  const navigate = useNavigate();
  const { topic, sessionId, addChatMessage } = useSessionStore();

  const [explanation, setExplanation] = useState('');
  const [explainSubmitted, setExplainSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Voice recording — appends live transcript into the textarea
  const handleTranscript = useCallback((liveText) => {
    setExplanation(liveText);
  }, []);

  const { isRecording, isSupported, error: voiceError, toggle: toggleRecording } = useVoiceRecorder({
    onTranscript: handleTranscript,
  });

  const handleSessionDone = () => navigate('/report');

  const submitExplanation = async () => {
    const text = explanation.trim();
    if (!text) return;
    if (text.length < 20) {
      setError('Please provide a more detailed explanation (at least 20 characters).');
      return;
    }
    setError('');
    setIsSubmitting(true);

    if (isRecording) toggleRecording();

    try {
      const res = await api.submitExplanation({
        session_id: sessionId,
        explanation_text: text,
      });

      const { ai_message, is_done } = res.data;
      addChatMessage({ role: 'assistant', content: ai_message });
      setExplainSubmitted(true);

      if (is_done) {
        setTimeout(() => navigate('/report'), 1400);
      }
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Could not submit explanation. Please try again.';
      setError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.25rem 0' }}>Learning Session</h2>
          <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.9rem' }}>Topic: {topic || 'General'}</p>
        </div>
        <button
          onClick={() => navigate('/report')}
          style={{
            backgroundColor: 'var(--danger)', color: 'white', border: 'none',
            padding: '0.5rem 1.25rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          End Session
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left: Chat */}
        <div className="card-wrapper" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '600px' }}>
          <ChatWindow onSessionDone={handleSessionDone} />
        </div>

        {/* Right: Explanation */}
        <div className="card-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
          <h4 style={{ margin: '0 0 1.5rem 0' }}>Your Explanation</h4>

          {/* Mic button */}
          {!explainSubmitted && (
            <div style={{ marginBottom: '1rem' }}>
              <button
                onClick={toggleRecording}
                disabled={!isSupported}
                title={
                  !isSupported ? 'Speech recognition not supported in this browser'
                  : isRecording ? 'Click to stop recording'
                  : 'Click to start recording'
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.5rem 1rem',
                  border: `1px solid ${isRecording ? '#e53e3e' : 'var(--border)'}`,
                  borderRadius: '6px',
                  background: isRecording ? '#fff5f5' : 'transparent',
                  color: isRecording ? '#e53e3e' : 'var(--text-dark)',
                  cursor: isSupported ? 'pointer' : 'not-allowed',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                  opacity: isSupported ? 1 : 0.5,
                  alignSelf: 'flex-start',
                }}
              >
                {isRecording ? (
                  <>
                    <span style={{
                      display: 'inline-block', width: '10px', height: '10px',
                      borderRadius: '50%', backgroundColor: '#e53e3e',
                      animation: 'micpulse 1s infinite',
                    }} />
                    <MicOff size={16} /> Stop Recording
                  </>
                ) : (
                  <><Mic size={16} /> Start Recording</>
                )}
              </button>

              <style>{`
                @keyframes micpulse {
                  0%, 100% { opacity: 1; transform: scale(1); }
                  50% { opacity: 0.3; transform: scale(1.4); }
                }
              `}</style>

              {(voiceError || !isSupported) && (
                <p style={{ color: '#e53e3e', fontSize: '0.8rem', margin: '0.4rem 0 0 0' }}>
                  {voiceError || '⚠ Speech recognition requires Chrome or Edge.'}
                </p>
              )}
              {isRecording && !voiceError && (
                <p style={{ color: '#e53e3e', fontSize: '0.8rem', margin: '0.4rem 0 0 0' }}>
                  🎙 Recording… speak now. Your words will appear below.
                </p>
              )}
            </div>
          )}

          {/* Textarea */}
          <textarea
            placeholder={isRecording ? '🎙 Listening… speak now…' : 'Or type your explanation here…'}
            value={explanation}
            onChange={(e) => !explainSubmitted && setExplanation(e.target.value)}
            disabled={explainSubmitted || isSubmitting}
            style={{
              flex: 1,
              width: '100%',
              padding: '1rem',
              borderRadius: '8px',
              border: `1px solid ${isRecording ? '#e53e3e' : error ? '#e53e3e' : 'var(--border)'}`,
              fontFamily: 'inherit',
              resize: 'none',
              marginBottom: '0.5rem',
              outline: 'none',
              backgroundColor: explainSubmitted ? '#f5f5f5' : isRecording ? '#fff9f9' : '#fafafa',
              cursor: explainSubmitted ? 'not-allowed' : 'text',
              transition: 'border-color 0.2s, background-color 0.2s',
              boxSizing: 'border-box',
            }}
          />

          {error && (
            <p style={{ color: '#e53e3e', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>⚠ {error}</p>
          )}

          {!explainSubmitted ? (
            <button
              className="btn-primary"
              onClick={submitExplanation}
              disabled={isSubmitting || !explanation.trim()}
              style={{
                width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                opacity: (isSubmitting || !explanation.trim()) ? 0.6 : 1,
                cursor: (isSubmitting || !explanation.trim()) ? 'not-allowed' : 'pointer',
              }}
            >
              <Send size={16} />
              {isSubmitting ? 'Submitting…' : 'Submit Explanation'}
            </button>
          ) : (
            <div style={{
              padding: '0.75rem 1rem', borderRadius: '6px',
              backgroundColor: '#e6f4ea', color: '#2d6a4f',
              fontSize: '0.9rem', textAlign: 'center',
            }}>
              ✓ Explanation submitted — reply to the AI's questions in the chat!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { Send } from 'lucide-react';
import { api } from '../api/client';

export default function ChatWindow({ onSessionDone }) {
  const { chatHistory, addChatMessage, sessionId } = useSessionStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    addChatMessage({ role: 'user', content: text });
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.sendChatMessage({
        session_id: sessionId,
        user_message: text,
      });

      const { ai_message, is_done } = res.data;
      addChatMessage({ role: 'assistant', content: ai_message });

      if (is_done && onSessionDone) {
        // Short delay so the user can read the closing message
        setTimeout(() => onSessionDone(), 1200);
      }
    } catch (error) {
      console.warn('Chat API unavailable, using mock response.', error);
      setTimeout(() => {
        addChatMessage({
          role: 'assistant',
          content: 'That is an interesting point! What happens when the learning rate is too high?',
        });
      }, 800);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>psychology</span>
        <h4 style={{ margin: 0 }}>AI Peer Questions</h4>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        padding: '1.5rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        {chatHistory.length === 0 && (
          <p style={{ color: 'var(--text-light)', textAlign: 'center', marginTop: '2rem' }}>
            Submit your explanation to start the Q&amp;A session.
          </p>
        )}

        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-primary)',
              color: msg.role === 'user' ? '#fff' : 'var(--text-dark)',
              padding: '1rem',
              borderRadius: '12px',
              borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
              borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '12px',
            }}
          >
            {msg.content}
          </div>
        ))}

        {isLoading && (
          <div style={{
            alignSelf: 'flex-start',
            backgroundColor: 'var(--bg-primary)',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            borderBottomLeftRadius: '4px',
            color: 'var(--text-light)',
            fontSize: '0.9rem',
          }}>
            Thinking…
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Reply to your peer…"
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '0.75rem',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            outline: 'none',
            opacity: isLoading ? 0.6 : 1,
          }}
        />
        <button
          className="btn-primary"
          onClick={handleSend}
          disabled={isLoading}
          style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

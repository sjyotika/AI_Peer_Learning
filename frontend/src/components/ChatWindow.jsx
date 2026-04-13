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
    <div className="chat-window">
      <div className="chat-window__header">
        <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>psychology</span>
        <h4 style={{ margin: 0 }}>AI Peer Questions</h4>
      </div>

      <div className="chat-window__messages">
        {chatHistory.length === 0 && (
          <p className="chat-window__empty">
            Submit your explanation to start the Q&amp;A session.
          </p>
        )}

        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-window__bubble ${msg.role === 'user' ? 'is-user' : 'is-ai'}`}
          >
            {msg.content}
          </div>
        ))}

        {isLoading && (
          <div className="chat-window__thinking">
            Thinking…
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-window__input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Reply to your peer…"
          disabled={isLoading}
          className="chat-window__text-input"
          style={{ opacity: isLoading ? 0.6 : 1 }}
        />
        <button
          className="btn-primary"
          onClick={handleSend}
          disabled={isLoading}
          style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

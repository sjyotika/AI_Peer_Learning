import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { api } from '../api/client';
import { BookOpen, ChevronRight, Plus, Clock, Target, Layers } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, resetSession } = useSessionStore();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSessions() {
      setIsLoading(true);
      try {
        const res = await api.getUserSessions(user?.email);
        setSessions(res.data?.sessions || []);
      } catch (err) {
        setError('Could not load your sessions.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    if (user?.email) loadSessions();
  }, [user?.email]);

  const handleStartNew = () => {
    resetSession();
    navigate('/upload');
  };

  const handleOpenSession = (sessionId) => {
    navigate(`/session/${sessionId}`);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getScoreColor = (score) => {
    if (score >= 75) return '#2d6a4f';
    if (score >= 50) return '#b45309';
    return '#c53030';
  };

  const getScoreBg = (score) => {
    if (score >= 75) return '#e6f4ea';
    if (score >= 50) return '#fef3c7';
    return '#fff5f5';
  };

  return (
    <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '0 1rem' }}>

      {/* Welcome header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.8rem' }}>
          Welcome back, {user?.name || 'Student'} 👋
        </h2>
        <p style={{ color: 'var(--text-light)', margin: 0 }}>
          Here are all your past learning sessions.
        </p>
      </div>

      {/* Stats row */}
      {!isLoading && sessions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
          <StatCard
            icon={<Layers size={20} />}
            label="Total Sessions"
            value={sessions.length}
            color="var(--primary)"
          />
          <StatCard
            icon={<Target size={20} />}
            label="Avg. Accuracy"
            value={
              Math.round(
                sessions.reduce((acc, s) => acc + (s.report?.accuracy_pct || 0), 0) / sessions.length
              ) + '%'
            }
            color="#b11685"
          />
          <StatCard
            icon={<BookOpen size={20} />}
            label="Avg. Coverage"
            value={
              Math.round(
                sessions.reduce((acc, s) => acc + (s.report?.coverage_pct || 0), 0) / sessions.length
              ) + '%'
            }
            color="#2d6a4f"
          />
        </div>
      )}

      {/* Session list */}
      <div style={{ marginBottom: '6rem' /* space for FAB */ }}>
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Your Sessions</h3>

        {isLoading && (
          <div style={{ color: 'var(--text-light)', padding: '3rem', textAlign: 'center' }}>
            Loading your sessions…
          </div>
        )}

        {error && (
          <div style={{ color: '#c53030', padding: '1rem', textAlign: 'center' }}>{error}</div>
        )}

        {!isLoading && !error && sessions.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '4rem 2rem',
            border: '2px dashed var(--border)', borderRadius: '12px',
            color: 'var(--text-light)',
          }}>
            <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
            <h4 style={{ margin: '0 0 0.5rem 0' }}>No sessions yet</h4>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              Click <strong>Start New Session</strong> below to upload your first document.
            </p>
          </div>
        )}

        {!isLoading && sessions.map((session) => {
          const overall = session.report
            ? Math.round(((session.report.coverage_pct || 0) + (session.report.accuracy_pct || 0)) / 2)
            : null;

          return (
            <div
              key={session.session_id}
              onClick={() => handleOpenSession(session.session_id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                padding: '1.25rem 1.5rem',
                backgroundColor: '#fff',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                marginBottom: '0.875rem',
                cursor: 'pointer',
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              {/* Icon */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                backgroundColor: 'var(--primary-light, #ece9ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <BookOpen size={20} color="var(--primary)" />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.2rem', 
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {session.topic || session.original_filename || 'Untitled Session'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem', color: 'var(--text-light)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Clock size={12} /> {formatDate(session.updated_at)}
                  </span>
                  {session.keywords?.length > 0 && (
                    <span>
                      {session.keywords.slice(0, 3).join(' · ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Score badge */}
              {overall !== null ? (
                <div style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  backgroundColor: getScoreBg(overall),
                  color: getScoreColor(overall),
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  flexShrink: 0,
                }}>
                  {overall}%
                </div>
              ) : (
                <div style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  backgroundColor: '#f3f4f6',
                  color: 'var(--text-light)',
                  fontSize: '0.8rem',
                  flexShrink: 0,
                }}>
                  In progress
                </div>
              )}

              <ChevronRight size={18} color="var(--text-light)" style={{ flexShrink: 0 }} />
            </div>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleStartNew}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.875rem 1.5rem',
          backgroundColor: 'var(--primary)',
          color: '#fff',
          border: 'none',
          borderRadius: '50px',
          fontWeight: 700,
          fontSize: '1rem',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          zIndex: 200,
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.22)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.18)';
        }}
      >
        <Plus size={20} /> Start New Session
      </button>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card-wrapper" style={{ padding: '1.25rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color, marginBottom: '0.75rem' }}>
        {icon}
        <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-dark)' }}>{value}</div>
    </div>
  );
}

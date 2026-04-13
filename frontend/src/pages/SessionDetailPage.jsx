import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RadarChart from '../components/RadarChart';
import GapList from '../components/GapList';
import { api } from '../api/client';
import { ArrowLeft, BookOpen, MessageSquare, BarChart2 } from 'lucide-react';

const TABS = [
  { id: 'explanation', label: 'Explanation', icon: <BookOpen size={16} /> },
  { id: 'chat', label: 'Chat History', icon: <MessageSquare size={16} /> },
  { id: 'report', label: 'Evaluation', icon: <BarChart2 size={16} /> },
];

export default function SessionDetailPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('explanation');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await api.getSessionDetail(sessionId);
        setSession(res.data);
      } catch (err) {
        setError('Could not load this session.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>
        Loading session…
      </div>
    );
  }

  if (error || !session) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#c53030' }}>
        {error || 'Session not found.'}
      </div>
    );
  }

  const report = session.report;
  const conversation = session.conversation || [];
  const coverage = report?.coverage_pct ?? 0;
  const accuracy = report?.accuracy_pct ?? 0;
  const overall = Math.round((coverage + accuracy) / 2);
  const depthLevel = coverage > 85 ? 'Advanced' : coverage > 60 ? 'Intermediate' : 'Beginner';

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="page-container session-detail-page">

      {/* Back button + title */}
      <div className="page-header-row" style={{ alignItems: 'flex-start' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-ghost"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h2 className="page-title" style={{ marginBottom: '0.2rem' }}>
            {session.topic || session.original_filename || 'Session'}
          </h2>
          <p className="page-subtitle" style={{ margin: 0 }}>
            {formatDate(session.updated_at)}
          </p>
        </div>
      </div>

      {/* Overall score banner */}
      {report && (
        <div className="report-stats-grid" style={{ marginBottom: '2rem' }}>
          <ScorePill label="Overall Score" value={`${overall}%`} color="var(--primary)" />
          <ScorePill label="Coverage" value={`${coverage}%`} color="var(--primary)" />
          <ScorePill label="Accuracy" value={`${accuracy}%`} color="#b11685" />
        </div>
      )}

      {/* Tabs */}
      <div className="tabbar" style={{ marginBottom: '2rem' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tabbar__item ${activeTab === tab.id ? 'is-active' : ''}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'explanation' && (
        <div className="card-wrapper">
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-light)', fontSize: '0.8rem',
            textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Student's Explanation
          </h4>
          {session.student_explanation ? (
            <p style={{ margin: 0, lineHeight: 1.8, color: 'var(--text-dark)', whiteSpace: 'pre-wrap' }}>
              {session.student_explanation}
            </p>
          ) : (
            <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No explanation recorded.</p>
          )}
          {session.keywords?.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem',
                color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Key Topics from Document
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {session.keywords.map((kw, i) => (
                  <span key={i} style={{
                    padding: '0.25rem 0.75rem', borderRadius: '20px',
                    backgroundColor: 'var(--primary-light, #ece9ff)',
                    color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 500,
                  }}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {conversation.length === 0 ? (
            <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>
              No chat history for this session.
            </p>
          ) : (
            conversation.map((msg, idx) => (
              <div
                key={idx}
                className={`chat-window__bubble ${msg.role === 'user' ? 'is-user' : 'is-ai'}`}
              >
                <div style={{ fontSize: '0.7rem', opacity: 0.65, marginBottom: '0.3rem',
                  textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {msg.role === 'user' ? 'You' : 'AI Peer'}
                </div>
                {msg.content}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'report' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!report ? (
            <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>
              No evaluation report was generated for this session.
            </p>
          ) : (
            <>
              {/* Radar */}
              <div className="card-wrapper">
                <h4 style={{ margin: '0 0 1rem 0' }}>Radar Analysis</h4>
                <RadarChart radarData={report.radar_data} />
              </div>

              {/* Scores */}
              <div className="report-stats-grid">
                <MiniScoreCard label="Coverage" value={coverage} color="var(--primary)" />
                <MiniScoreCard label="Accuracy" value={accuracy} color="#b11685" />
                <div className="card-wrapper" style={{ padding: '1.25rem' }}>
                  <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.72rem', color: 'var(--text-light)',
                    textTransform: 'uppercase', letterSpacing: '0.5px' }}>Depth</p>
                  <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {depthLevel}
                  </p>
                </div>
              </div>

              {/* Misconceptions */}
              {report.misconceptions?.length > 0 && (
                <div className="card-wrapper">
                  <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#e53e3e', fontSize: '1.1rem' }}>warning</span>
                    Misconceptions
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {report.misconceptions.map((m, i) => (
                      <li key={i} style={{ color: 'var(--text-dark)', lineHeight: 1.6 }}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {report.suggestions?.length > 0 && (
                <div className="card-wrapper">
                  <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>tips_and_updates</span>
                    Suggestions
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {report.suggestions.map((s, i) => (
                      <li key={i} style={{ color: 'var(--text-dark)', lineHeight: 1.6 }}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Gaps */}
              <div>
                <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>tips_and_updates</span>
                  Gap Detection
                </h4>
                <GapList gaps={report.gaps || []} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ScorePill({ label, value, color }) {
  return (
    <div className="card-wrapper" style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
      <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.75rem', color: 'var(--text-light)',
        textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color }}>{value}</p>
    </div>
  );
}

function MiniScoreCard({ label, value, color }) {
  return (
    <div className="card-wrapper" style={{ padding: '1.25rem' }}>
      <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.72rem', color: 'var(--text-light)',
        textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', fontWeight: 700, color }}>{value}%</p>
      <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: '2px' }} />
      </div>
    </div>
  );
}

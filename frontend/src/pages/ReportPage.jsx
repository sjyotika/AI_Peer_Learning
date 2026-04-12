import React, { useEffect, useState } from 'react';
import RadarChart from '../components/RadarChart';
import GapList from '../components/GapList';
import { useSessionStore } from '../store/sessionStore';
import { api } from '../api/client';

export default function ReportPage() {
  const { topic, sessionId } = useSessionStore();
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setError('No active session. Please upload a file and complete the explanation step first.');
      setIsLoading(false);
      return;
    }

    async function fetchReport() {
      setIsLoading(true);
      setError('');
      try {
        // First try to get a cached report
        const cached = await api.getReport(sessionId).catch(() => null);
        if (cached?.data) {
          setReportData(cached.data);
          setIsLoading(false);
          return;
        }
        // Otherwise generate a new one (POST)
        const res = await api.generateReport({ session_id: sessionId });
        setReportData(res.data);
      } catch (err) {
        const detail = err?.response?.data?.detail || 'Failed to generate report. Please try again.';
        setError(detail);
        console.error('Report error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReport();
  }, [sessionId]);

  const coverage = reportData?.coverage_pct ?? 0;
  const accuracy = reportData?.accuracy_pct ?? 0;
  const overall = Math.round((coverage + accuracy) / 2);
  const depthLevel = coverage > 85 ? 'Advanced' : coverage > 60 ? 'Intermediate' : 'Beginner';

  if (isLoading) {
    return (
      <div style={{ maxWidth: '600px', width: '100%', margin: '4rem auto', textAlign: 'center', color: 'var(--text-light)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <h3>Generating your evaluation report…</h3>
        <p>This may take a few seconds while we analyse your explanation.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', width: '100%', margin: '4rem auto', textAlign: 'center', color: '#e53e3e' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠</div>
        <h3>Could not load report</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Hero Header */}
      <div style={{
        backgroundColor: 'var(--primary)',
        color: '#fff',
        padding: '2rem',
        borderRadius: '16px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '0.7rem', letterSpacing: '1px', opacity: 0.8, marginBottom: '1rem', textTransform: 'uppercase' }}>
          Evaluation Report
        </div>
        <h2 style={{ fontSize: '2rem', margin: '0 0 1rem 0' }}>
          Mastery achieved in<br />{topic || 'Your Topic'}.
        </h2>
        <p style={{ opacity: 0.9, lineHeight: 1.6, marginBottom: '2rem', fontSize: '0.9rem' }}>
          Your explanation captured the core concepts with {accuracy}% accuracy.{' '}
          {reportData?.suggestions?.[0] || ''}
        </p>

        {/* Score Ring */}
        <div style={{
          width: '120px', height: '120px',
          border: '8px solid rgba(255,255,255,0.2)',
          borderTopColor: '#fff',
          borderRadius: '50%',
          margin: '0 auto',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {overall}<span style={{ fontSize: '1rem' }}>%</span>
          </span>
          <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Overall Score</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div className="card-wrapper" style={{ padding: '1.5rem 1rem' }}>
          <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-light)', fontSize: '0.7rem' }}>COVERAGE SCORE</h5>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.5rem' }}>{coverage}%</div>
          <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px' }}>
            <div style={{ height: '100%', background: 'var(--primary)', width: `${coverage}%`, borderRadius: '2px' }} />
          </div>
        </div>

        <div className="card-wrapper" style={{ padding: '1.5rem 1rem' }}>
          <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-light)', fontSize: '0.7rem' }}>ACCURACY SCORE</h5>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#b11685', marginBottom: '0.5rem' }}>{accuracy}%</div>
          <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px' }}>
            <div style={{ height: '100%', background: '#b11685', width: `${accuracy}%`, borderRadius: '2px' }} />
          </div>
        </div>

        <div className="card-wrapper" style={{ padding: '1.5rem 1rem' }}>
          <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-light)', fontSize: '0.7rem' }}>DEPTH SCORE</h5>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.5rem' }}>{depthLevel}</div>
          <div style={{ display: 'flex', gap: '4px', height: '4px' }}>
            <div style={{ flex: 1, background: coverage > 20 ? 'var(--primary)' : 'var(--border)', borderRadius: '2px' }} />
            <div style={{ flex: 1, background: coverage > 60 ? 'var(--primary)' : 'var(--border)', borderRadius: '2px' }} />
            <div style={{ flex: 1, background: coverage > 85 ? 'var(--primary)' : 'var(--border)', borderRadius: '2px' }} />
            <div style={{ flex: 1, background: 'var(--border)', borderRadius: '2px' }} />
          </div>
        </div>
      </div>

      {/* Radar chart */}
      <div className="card-wrapper">
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          Radar Analysis
        </h4>
        <RadarChart radarData={reportData?.radar_data} />
      </div>

      {/* Misconceptions */}
      {reportData?.misconceptions?.length > 0 && (
        <div className="card-wrapper">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#e53e3e' }}>warning</span>
            Misconceptions Detected
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {reportData.misconceptions.map((m, i) => (
              <li key={i} style={{ color: 'var(--text-dark)', fontSize: '0.95rem' }}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {reportData?.suggestions?.length > 0 && (
        <div className="card-wrapper">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>tips_and_updates</span>
            Suggestions to Improve
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {reportData.suggestions.map((s, i) => (
              <li key={i} style={{ color: 'var(--text-dark)', fontSize: '0.95rem' }}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Gap Detection */}
      <div>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>tips_and_updates</span>
          Gap Detection
        </h3>
        <p style={{ color: 'var(--text-light)' }}>
          Specific technical areas missing from your response compared to the uploaded material.
        </p>
        <GapList gaps={reportData?.gaps || []} />
      </div>
    </div>
  );
}

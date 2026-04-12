import React from 'react';

export default function GapList({ gaps = [] }) {
  if (gaps.length === 0) {
    return (
      <div style={{ color: 'var(--text-light)', padding: '1rem 0' }}>
        No gaps identified! Excellent explanation.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {gaps.map((gap, index) => (
        <div key={index} style={{ 
          backgroundColor: '#fff', 
          padding: '1.5rem', 
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start'
        }}>
          <div style={{ 
            backgroundColor: 'var(--primary)', 
            color: 'white', 
            width: '24px', 
            height: '24px', 
            borderRadius: '50%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            flexShrink: 0
          }}>
            {index + 1}
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', textTransform: 'capitalize' }}>{gap}</h4>
            <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              This core concept was missing or under-explained in your response based on the uploaded material.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

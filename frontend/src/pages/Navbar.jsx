import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { setAuthEmail } from '../api/client';

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useSessionStore();

  const handleLogout = () => {
    logout();
    setAuthEmail(null);
    navigate('/signin');
  };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      backgroundColor: '#fff', borderBottom: '1px solid var(--border)',
      padding: '0 2rem', height: '64px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Brand — goes to dashboard if logged in, otherwise home */}
      <Link
        to={isAuthenticated ? '/dashboard' : '/'}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.3rem', textDecoration: 'none',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '1.8rem' }}>menu_book</span>
        LearnPeer
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" style={{ color: 'var(--text-dark)', textDecoration: 'none', fontSize: '0.9rem' }}>
              My Sessions
            </Link>
            <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
              Hi, <strong style={{ color: 'var(--text-dark)' }}>{user?.name || 'Student'}</strong>
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem', border: '1px solid var(--border)',
                borderRadius: '6px', background: 'transparent',
                cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-dark)',
              }}
            >Sign Out</button>
          </>
        ) : (
          <>
            <Link to="/signin" style={{ color: 'var(--text-dark)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500 }}>
              Sign In
            </Link>
            <Link to="/signin" style={{
              padding: '0.5rem 1.25rem', backgroundColor: 'var(--primary)',
              color: '#fff', borderRadius: '6px', textDecoration: 'none',
              fontSize: '0.9rem', fontWeight: 600,
            }}>Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}

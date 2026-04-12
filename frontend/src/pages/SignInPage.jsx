import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { setAuthEmail } from '../api/client';

export default function SignInPage() {
  const navigate = useNavigate();
  const { uploadedDocument, setIsAuthenticated } = useSessionStore();
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');

  const handleChange = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!formData.email || !formData.password) { setError('Email and password are required.'); return; }
    if (!isLogin && formData.password !== formData.confirm) { setError('Passwords do not match.'); return; }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters.'); return; }

    const userName = isLogin
      ? formData.email.split('@')[0]
      : (formData.name || formData.email.split('@')[0]);

    const userData = { name: userName, email: formData.email };
    setIsAuthenticated(true, userData);

    // Set email on axios so all future requests are tagged
    setAuthEmail(formData.email);

    // Always go to dashboard after sign-in
    navigate('/dashboard');
  };

  const inputStyle = {
    width: '100%', padding: '0.75rem', borderRadius: '6px',
    border: '1px solid var(--border)', outline: 'none',
    fontSize: '0.95rem', boxSizing: 'border-box',
  };
  const labelStyle = { display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 };

  return (
    <div style={{
      maxWidth: '400px', width: '100%', margin: '2rem auto', padding: '2.5rem',
      backgroundColor: 'var(--bg-card)', borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{
        backgroundColor: 'var(--primary-light, #ece9ff)', color: 'var(--primary)',
        width: '48px', height: '48px', borderRadius: '50%',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        marginBottom: '1.5rem', fontSize: '1.5rem',
      }}>
        <span className="material-symbols-outlined">menu_book</span>
      </div>

      <h2 style={{ margin: '0 0 0.5rem 0', textAlign: 'center' }}>
        {isLogin ? 'Sign in to LearnPeer' : 'Create an account'}
      </h2>
      <p style={{ color: 'var(--text-light)', margin: '0 0 2rem 0', textAlign: 'center', fontSize: '0.9rem' }}>
        {isLogin ? 'Welcome back! Please enter your details.' : 'Start your learning journey today'}
      </p>

      {error && (
        <div style={{
          width: '100%', marginBottom: '1rem', padding: '0.75rem',
          backgroundColor: '#fff5f5', border: '1px solid #feb2b2',
          borderRadius: '6px', color: '#c53030', fontSize: '0.85rem',
        }}>⚠ {error}</div>
      )}

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {!isLogin && (
          <div>
            <label style={labelStyle}>Full Name</label>
            <input type="text" placeholder="John Doe" value={formData.name} onChange={handleChange('name')} style={inputStyle} />
          </div>
        )}
        <div>
          <label style={labelStyle}>Email</label>
          <input type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange('email')} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Password</label>
          <input type="password" placeholder="At least 8 characters" value={formData.password} onChange={handleChange('password')} style={inputStyle} />
        </div>
        {!isLogin && (
          <div>
            <label style={labelStyle}>Confirm Password</label>
            <input type="password" placeholder="Re-enter your password" value={formData.confirm} onChange={handleChange('confirm')} style={inputStyle} />
          </div>
        )}
        <button
          onClick={handleSubmit}
          style={{
            width: '100%', padding: '0.85rem', backgroundColor: '#1a1a1a', color: 'white',
            border: 'none', borderRadius: '6px', fontWeight: 600,
            marginTop: '1rem', cursor: 'pointer', fontSize: '1rem',
          }}
        >
          {isLogin ? 'Sign in' : 'Create account'}
        </button>
      </div>

      <div style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-light)' }}>
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <span onClick={() => { setIsLogin(!isLogin); setError(''); }}
          style={{ color: 'var(--text-dark)', fontWeight: 600, cursor: 'pointer' }}>
          {isLogin ? 'Sign up' : 'Sign in'}
        </span>
      </div>
    </div>
  );
}

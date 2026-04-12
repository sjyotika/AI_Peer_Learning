import React from 'react';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#f1f2f6', padding: '4rem 0', marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: '3rem', padding: '0 2rem' }}>
        
        {/* Brand & Contact */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>menu_book</span>
            LearnPeer
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '80%' }}>
            Empowering students with AI-driven study tools to master complex subjects and achieve academic excellence.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>mail</span> support@learnpeer.ai
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>call</span> +1 (555) 234-5678
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>location_on</span> 123 Innovation Way, SF, CA
            </div>
          </div>
        </div>

        {/* Resources */}
        <div>
          <h4 style={{ fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1.5rem', color: 'var(--text-dark)' }}>Resources</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem', color: 'var(--text-light)' }}>
            <span style={{ cursor: 'pointer' }}>Physics Hub</span>
            <span style={{ cursor: 'pointer' }}>Study Guides</span>
            <span style={{ cursor: 'pointer' }}>AI Roadmap</span>
            <span style={{ cursor: 'pointer' }}>Documentation</span>
            <span style={{ cursor: 'pointer' }}>FAQ</span>
          </div>
        </div>

        {/* Company */}
        <div>
          <h4 style={{ fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1.5rem', color: 'var(--text-dark)' }}>Company</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem', color: 'var(--text-light)' }}>
            <span style={{ cursor: 'pointer' }}>About Us</span>
            <span style={{ cursor: 'pointer' }}>Careers</span>
            <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
            <span style={{ cursor: 'pointer' }}>Terms of Service</span>
            <span style={{ cursor: 'pointer' }}>Contact</span>
          </div>
        </div>

        {/* Connect & Newsletter */}
        <div>
          <h4 style={{ fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1.5rem', color: 'var(--text-dark)' }}>Connect</h4>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#e5e7eb', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'background-color 0.2s' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>f</span>
            </div>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#e5e7eb', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'background-color 0.2s' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>𝕏</span>
            </div>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#e5e7eb', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'background-color 0.2s' }}>
               <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>ig</span>
            </div>
          </div>

          <h4 style={{ fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1.5rem', color: 'var(--text-dark)' }}>Newsletter</h4>
          <div style={{ display: 'flex', backgroundColor: '#e5e7eb', padding: '0.25rem', borderRadius: '8px' }}>
            <input type="email" placeholder="Enter email address" style={{ flex: 1, border: 'none', background: 'transparent', padding: '0.75rem', outline: 'none', fontSize: '0.95rem' }} />
            <button style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Join</button>
          </div>
        </div>

      </div>

      <div style={{ maxWidth: '1200px', margin: '3rem auto 0 auto', padding: '2rem 2rem 0 2rem', borderTop: '1px solid #d1d5db', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-light)', fontSize: '0.85rem' }}>
        <div>&copy; 2026 LearnPeer AI. All rights reserved.</div>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <span style={{ cursor: 'pointer' }}>System Status</span>
          <span style={{ cursor: 'pointer' }}>Privacy Settings</span>
          <span style={{ cursor: 'pointer' }}>Terms & Conditions</span>
        </div>
      </div>
    </footer>
  );
}

import React from 'react';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div>
          <div className="site-footer__brand">LearnPeer</div>
          <p className="site-footer__about">
            Empowering students with AI-driven study tools to master complex subjects and achieve academic excellence.
          </p>
          <ul className="site-footer__contact">
            <li><span className="material-symbols-outlined">mail</span> support@learnpeer.ai</li>
            <li><span className="material-symbols-outlined">call</span> +1 (555) 234-5678</li>
            <li><span className="material-symbols-outlined">location_on</span> 123 Innovation Way, SF, CA</li>
          </ul>
        </div>

        <div>
          <h4>Resources</h4>
          <ul className="site-footer__links">
            <li><a href="#">Physics Hub</a></li>
            <li><a href="#">Study Guides</a></li>
            <li><a href="#">AI Roadmap</a></li>
            <li><a href="#">Documentation</a></li>
            <li><a href="#">FAQ</a></li>
          </ul>
        </div>

        <div>
          <h4>Company</h4>
          <ul className="site-footer__links">
            <li><a href="#">About Us</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>

        <div>
          <h4>Connect</h4>
          <div className="site-footer__socials">
            <button type="button" aria-label="Facebook">f</button>
            <button type="button" aria-label="X">𝕏</button>
            <button type="button" aria-label="Instagram">ig</button>
          </div>

          <h4 className="site-footer__newsletter-heading">Newsletter</h4>
          <form className="site-footer__newsletter" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Enter email address" aria-label="Email address" />
            <button type="submit">Join</button>
          </form>
        </div>
      </div>

      <div className="site-footer__bottom">
        <div>© 2026 LearnPeer AI. All rights reserved.</div>
        <div>
          <a href="#">System Status</a>
          <a href="#">Privacy Settings</a>
          <a href="#">Terms & Conditions</a>
        </div>
      </div>
    </footer>
  );
}

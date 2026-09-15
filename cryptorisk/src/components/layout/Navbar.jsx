import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth }  from '../../context/AuthContext';
import './Navbar.css';


// Sun icon (light mode indicator)
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1"  x2="12" y2="3"  />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"  />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1"  y1="12" x2="3"  y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

// Moon icon (dark mode indicator)
function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Navbar({ user: userProp }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { user: authUser } = useAuth();
  const user = authUser || userProp;

  return (
    <header className="navbar">
      <div className="navbar__brand">
        <Link to="/dashboard" className="navbar__logo">
          <span className="navbar__logo-icon">₿</span>
          <span className="navbar__logo-text">CryptoRisk</span>
        </Link>
      </div>

      <nav className="navbar__nav">
        <NavLink to="/dashboard" className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>
          Dashboard
        </NavLink>
        <NavLink to="/portfolio" className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>
          Portfolio
        </NavLink>
        <NavLink to="/analysis" className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>
          Analysis
        </NavLink>
      </nav>


      <div className="navbar__right">
        {/* ── Theme toggle button ── */}
        <button
          className="navbar__theme-btn"
          onClick={toggle}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          title={theme === 'light' ? 'Dark mode' : 'Light mode'}
        >
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>

        <div
          className="navbar__avatar-wrap"
          onClick={() => setMenuOpen(!menuOpen)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setMenuOpen(!menuOpen)}
          aria-label="User menu"
        >
          <div className="navbar__avatar">{user?.avatar || 'AJ'}</div>
          <span className="navbar__username">{user?.name || 'Alex Johnson'}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {menuOpen && (
          <div className="navbar__dropdown">
            <div className="navbar__dropdown-header">
              <p className="fw-600">{user?.name}</p>
              <p className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>{user?.email}</p>
            </div>
            <div className="navbar__dropdown-divider" />
            <button className="navbar__dropdown-item" onClick={() => navigate('/profile')}>Profile Settings</button>
            <button className="navbar__dropdown-item text-danger" onClick={() => navigate('/login')}>Sign Out</button>
          </div>
        )}
      </div>

      {/* Mobile hamburger */}
      <button className="navbar__hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
        <span /><span /><span />
      </button>
    </header>
  );
}

import React from 'react';
import { Sparkles, Sun, Moon } from 'lucide-react';

export default function Navbar({ onStart, toggleTheme, theme }) {
  return (
    <nav className="landing-nav glass-panel">
      <div className="nav-logo">
        <Sparkles className="logo-icon" />
        <span className="logo-text">AirDraw</span>
      </div>
      <div className="nav-links">
        <button 
          className="btn-icon" 
          onClick={toggleTheme} 
          style={{ width: '36px', height: '36px', borderRadius: '50%' }}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <a href="#features">Features</a>
        <a href="#about">About</a>
        <button className="nav-cta" onClick={onStart}>
          Try Now
        </button>
      </div>
    </nav>
  );
}

import React from 'react';

export default function Footer() {
  return (
    <footer className="landing-footer">
      <div className="footer-content">
        <p>© {new Date().getFullYear()} AirDraw Virtual. Crafted with React & Computer Vision.</p>
      </div>
    </footer>
  );
}

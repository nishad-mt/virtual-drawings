import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import Features from './Features';
import Footer from './Footer';

export default function Landing({ onStart, toggleTheme, theme }) {
  // Add a special class to body for the landing page scrolling
  useEffect(() => {
    document.body.style.overflow = 'auto'; // allow scroll on landing page
    return () => {
      document.body.style.overflow = 'hidden'; // return to full app mode when unmounting
    };
  }, []);

  return (
    <div className="landing-page">
      <Navbar onStart={onStart} toggleTheme={toggleTheme} theme={theme} />
      <Hero onStart={onStart} />
      <Features />
      
      <section id="about" className="cta-section text-center py-20">
        <h2 className="section-title">Ready to create without limits?</h2>
        <p className="section-subtitle mb-8" style={{ maxWidth: '600px', margin: '0 auto 32px auto'}}>
          Join the revolution in digital interaction and test the state-of-the-art hand tracking drawing application entirely in your browser. No downloads required.
        </p>
        <button className="cta-primary active" onClick={onStart}>
          Start Drawing Now
        </button>
      </section>

      <Footer />
    </div>
  );
}

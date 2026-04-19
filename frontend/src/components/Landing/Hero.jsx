import React from 'react';
import { Hand, Activity, Zap, Play } from 'lucide-react';

export default function Hero({ onStart }) {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">
          Draw in the Air.<br/>
          <span className="text-gradient">Create Without Touch.</span>
        </h1>
        <p className="hero-description">
          Experience real-time virtual drawing using hand gestures powered by computer vision and AI. Step into the future of digital art.
        </p>
        <div className="hero-actions">
          <button className="cta-primary" onClick={onStart}>
            Explore Now <Play size={18} />
          </button>
        </div>
      </div>

      <div className="hero-visual">
        <div className="visual-container">
          {/* Abstract Hand tracking representation */}
          <div className="tracking-ring ring-1"></div>
          <div className="tracking-ring ring-2"></div>
          <div className="tracking-ring ring-3"></div>
          
          <div className="hand-wrapper glass-panel">
            <Hand size={80} className="hand-icon" />
            
            <div className="tracking-node node-1"></div>
            <div className="tracking-node node-2"></div>
            <div className="tracking-node node-3"></div>
            <div className="tracking-node node-4"></div>
            <div className="tracking-node node-5"></div>
            
            <Activity className="scanner-line" color="#3b82f6" />
          </div>

          {/* Floating abstract elements */}
          <div className="floating-element float-1">
            <Zap size={24} color="#10b981" />
          </div>
          <div className="floating-element float-2">
            <span className="ai-tag">AI Powered</span>
          </div>
        </div>
      </div>
    </section>
  );
}

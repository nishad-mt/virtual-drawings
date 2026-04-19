import React from 'react';
import { Camera, MousePointer2, MonitorSmartphone, BrainCircuit } from 'lucide-react';

const featureData = [
  {
    icon: <Camera size={32} />,
    title: 'Real-time gesture drawing',
    description: 'Instantly map your hand movements to the digital canvas in real-time with zero noticeable lag.'
  },
  {
    icon: <MousePointer2 size={32} />,
    title: 'No physical contact needed',
    description: 'Create purely through the air. Just a webcam and you, completely touch-free interaction.'
  },
  {
    icon: <MonitorSmartphone size={32} />,
    title: 'Smooth canvas rendering',
    description: 'Optimized performance utilizing advanced HTML5 canvas to guarantee smooth continuous lines.'
  },
  {
    icon: <BrainCircuit size={32} />,
    title: 'Powered by AI & CV',
    description: 'Cutting-edge computer vision models accurately detect and track your hand joints on the fly.'
  }
];

export default function Features() {
  return (
    <section id="features" className="features-section">
      <div className="features-header">
        <h2 className="section-title">Designed for Next-Gen Creativity</h2>
        <p className="section-subtitle">Everything you need to seamlessly bridge the physical and digital world.</p>
      </div>

      <div className="features-grid">
        {featureData.map((f, i) => (
          <div className="feature-card glass-panel" key={i}>
            <div className="feature-icon-wrapper">
              {f.icon}
            </div>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

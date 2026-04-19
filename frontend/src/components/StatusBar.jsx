import React from 'react';

export default function StatusBar({ status }) {
  const statusClasses = {
    'connected': 'connected',
    'backend_ready': 'backend_ready',
    'camera_active': 'camera_active',
    'disconnected': 'disconnected',
    'connecting': 'connecting',
    'reconnecting': 'reconnecting'
  };

  const statusTexts = {
    'connected': 'Initializing Vision...',
    'backend_ready': 'Vision Engine Ready',
    'camera_active': 'Camera Active',
    'disconnected': 'Disconnected',
    'connecting': 'Starting Environment...',
    'reconnecting': 'Restarting Vision...'
  };

  return (
    <div className="status-bar glass-panel">
      <div className={`status-indicator ${statusClasses[status] || 'disconnected'}`}></div>
      <span>{statusTexts[status] || 'Unknown'}</span>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Landing from './components/Landing/Landing';
import DrawingApp from './components/DrawingApp';
import './App.css'; // Leave if empty or styling

function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      {!hasStarted ? (
        <Landing onStart={() => setHasStarted(true)} toggleTheme={toggleTheme} theme={theme} />
      ) : (
        <DrawingApp onExit={() => setHasStarted(false)} toggleTheme={toggleTheme} theme={theme} />
      )}
    </>
  );
}

export default App;

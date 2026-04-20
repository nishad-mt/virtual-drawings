import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sun, Moon, Hand, MousePointer } from 'lucide-react';
import Canvas from './Canvas';
import Toolbar from './Toolbar';
import StatusBar from './StatusBar';
import { useMediaPipe } from '../hooks/useMediaPipe';
import '../App.css'; 

function DrawingApp({ onExit, toggleTheme, theme }) {
  const [color, setColor] = useState('#3b82f6');
  const [brushSize, setBrushSize] = useState(8);
  const [isEraser, setIsEraser] = useState(false);
  const [status, setStatus] = useState('disconnected');
  const [isAirDrawing, setIsAirDrawing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const canvasRef = useRef(null);
  const colorPickerRef = useRef(null);
  const eraseStartTimeRef = useRef(null);
  const isCanvasClearedRef = useRef(false);
  
  const isAirDrawingRef = useRef(isAirDrawing);
  useEffect(() => {
    isAirDrawingRef.current = isAirDrawing;
  }, [isAirDrawing]);

  // Handle gestures coming directly from MediaPipe locally in the browser
  const lastGestureAppRef = useRef('idle');
  const stopTimeoutRef = useRef(null);

  const handleGesture = useCallback((data) => {
    const { gesture, x, y, isGestureStart } = data;
    
    if (gesture === 'draw') {
      clearTimeout(stopTimeoutRef.current);
      
      const resumingFromStop = isGestureStart && lastGestureAppRef.current === 'stop';
      const actualIsStart = isGestureStart && !resumingFromStop;

      if (typeof canvasRef.current?.drawRemoteCoordinate === 'function') {
        canvasRef.current.drawRemoteCoordinate(x, y, actualIsStart);
      }
      if (typeof canvasRef.current?.clearCursor === 'function') {
        canvasRef.current.clearCursor();
      }
    } else {
      if (lastGestureAppRef.current === 'draw' && isGestureStart) {
        // Only end stroke when we just transitioned away from draw
        stopTimeoutRef.current = setTimeout(() => {
          if (typeof canvasRef.current?.endRemoteStroke === 'function') {
            canvasRef.current.endRemoteStroke();
          }
        }, 80);
      }
      
      if (gesture === 'stop') {
        if (typeof canvasRef.current?.updatePausePosition === 'function') {
          canvasRef.current.updatePausePosition(x, y);
        }
        if (typeof canvasRef.current?.drawCursor === 'function') {
          canvasRef.current.drawCursor(x, y);
        }
      } else {
        if (typeof canvasRef.current?.clearCursor === 'function') {
          canvasRef.current.clearCursor();
        }
      }
      
      // One-shot event trigger to prevent continuous re-erasing
      if (gesture === 'erase' && isGestureStart) {
        if (typeof canvasRef.current?.clearCanvas === 'function') {
          canvasRef.current.clearCanvas();
        }
      }
    }
    
    if (colorPickerRef.current?.handlePointerUpdate) {
      // Allow selection only during 'stop' gesture (pause) for air coloring
      colorPickerRef.current.handlePointerUpdate(x, y, gesture === 'stop');
    }
    
    lastGestureAppRef.current = gesture;
  }, []);

  const { isReady, isActive, videoRef, startCamera, stopCamera } = useMediaPipe(handleGesture);

  // Status mapping
  useEffect(() => {
    if (isActive) setStatus('camera_active');
    else if (isReady) setStatus('backend_ready');
    else setStatus('disconnected');
  }, [isReady, isActive]);

  const toggleVirtualMode = () => {
    setIsAirDrawing(!isAirDrawing);
  };

  // Synchronize actual hardware camera lifecycle purely with React's DOM-rendered state
  useEffect(() => {
    if (isAirDrawing) {
      // The video element is now securely mounted in the DOM!
      startCamera();
    } else {
      stopCamera();
    }
  }, [isAirDrawing, startCamera, stopCamera]);

  // Environment listeners for stability
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) stopCamera();
      else if (isAirDrawingRef.current) startCamera();
    };

    const handleBlur = () => stopCamera();
    const handleFocus = () => { if (isAirDrawingRef.current) startCamera(); };
    const handleBeforeUnload = () => stopCamera();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      stopCamera();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [startCamera, stopCamera]);

  return (
    <div className="app-container">
      <div className="app-header-controls">
         <button className="btn-icon glass-panel" onClick={onExit} style={{ width: 'auto', padding: '0 16px', borderRadius: '20px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>← Exit</span>
         </button>
         <button className="btn-icon glass-panel" onClick={toggleTheme} style={{ borderRadius: '20px' }} title="Toggle Theme">
             {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
         </button>
         
         <div className="divider" style={{ backgroundColor: 'var(--glass-border)', margin: '4px 0' }} />
         
         <div 
           style={{ position: 'relative', display: 'flex' }}
           onMouseEnter={() => setIsHovered(true)}
           onMouseLeave={() => setIsHovered(false)}
           onTouchStart={() => setIsHovered(true)}
           onTouchEnd={() => setTimeout(() => setIsHovered(false), 2000)}
         >
           <button 
             className={`btn-icon glass-panel ${isAirDrawing ? 'active' : ''}`}
             style={{ borderRadius: '20px' }} 
             onClick={toggleVirtualMode} 
           >
               {isAirDrawing ? <Hand size={18} /> : <MousePointer size={18} />}
           </button>
           
           {isHovered && (
             <div style={{
               position: 'absolute',
               top: '100%',
               left: '50%',
               transform: 'translateX(-50%)',
               marginTop: '12px',
               background: 'var(--accent-color)',
               color: 'white',
               padding: '6px 12px',
               borderRadius: '8px',
               fontSize: '12px',
               fontWeight: '600',
               whiteSpace: 'nowrap',
               boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
               zIndex: 50,
             }}>
               {isAirDrawing ? 'Switch to Normal Mode ✨' : 'Switch to Virtual Mode ✨'}
               <div style={{
                 position: 'absolute',
                 top: '-5px',
                 left: '50%',
                 transform: 'translateX(-50%)',
                 width: 0,
                 height: 0,
                 borderLeft: '6px solid transparent',
                 borderRight: '6px solid transparent',
                 borderBottom: '6px solid var(--accent-color)'
               }} />
             </div>
           )}
         </div>
      </div>

      <StatusBar status={status} />
      
      {isAirDrawing && (
        <div className="webcam-preview">
          <video 
            id="video-preview" 
            ref={videoRef} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
            playsInline 
            autoPlay 
            muted 
          />
        </div>
      )}

      <div className="canvas-container">
        <Canvas
          ref={canvasRef}
          color={color}
          brushSize={brushSize}
          isEraser={isEraser}
          boardColor={theme === 'light' ? '#f8fafc' : '#1e293b'}
        />
      </div>

      <Toolbar
        colorPickerRef={colorPickerRef}
        color={color}
        setColor={setColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        isEraser={isEraser}
        setIsEraser={setIsEraser}
        clearCanvas={() => canvasRef.current?.clearCanvas()}
        saveCanvas={() => canvasRef.current?.saveAsImage()}
        undo={() => canvasRef.current?.undo()}
        redo={() => canvasRef.current?.redo()}
      />
    </div>
  );
}

export default DrawingApp;

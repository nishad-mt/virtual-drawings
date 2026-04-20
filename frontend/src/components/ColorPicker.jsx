import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

const ColorPicker = forwardRef(({ color, setColor, isEraser, setIsEraser }, ref) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const lastPickTime = useRef(0);
  const [pickPos, setPickPos] = useState(null);

  // Expose method to handle MediaPipe global cursor updates
  useImperativeHandle(ref, () => ({
    handlePointerUpdate: (globalX, globalY, isSelecting) => {
      // globalX, globalY are 0..1 normalized across the window
      if (!canvasRef.current || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const screenX = globalX * window.innerWidth;
      const screenY = globalY * window.innerHeight;

      // Check if cursor is inside ColorPicker
      // We add a tiny buffer margin to make picking easier via air gestures
      if (screenX >= rect.left - 10 && screenX <= rect.right + 10 && 
          screenY >= rect.top - 10 && screenY <= rect.bottom + 10) {
        
        if (isSelecting) {
          // Calculate relative coords inside the canvas
          let relativeX = screenX - rect.left;
          let relativeY = screenY - rect.top;
          
          // Clamp to boundaries safely
          relativeX = Math.max(0, Math.min(relativeX, rect.width));
          relativeY = Math.max(0, Math.min(relativeY, rect.height));

          pickColorAt(relativeX, relativeY, rect);
        }
      }
    }
  }));

  const drawGradient = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const width = canvas.width;
    const height = canvas.height;

    // Horizontal hue gradient
    const hueGradient = ctx.createLinearGradient(0, 0, width, 0);
    hueGradient.addColorStop(0, "rgb(255, 0, 0)");
    hueGradient.addColorStop(0.17, "rgb(255, 255, 0)");
    hueGradient.addColorStop(0.33, "rgb(0, 255, 0)");
    hueGradient.addColorStop(0.5, "rgb(0, 255, 255)");
    hueGradient.addColorStop(0.67, "rgb(0, 0, 255)");
    hueGradient.addColorStop(0.83, "rgb(255, 0, 255)");
    hueGradient.addColorStop(1, "rgb(255, 0, 0)");
    ctx.fillStyle = hueGradient;
    ctx.fillRect(0, 0, width, height);

    // Vertical lightness/darkness gradient
    // White at top, transparent middle, black at bottom
    const vertGradient = ctx.createLinearGradient(0, 0, 0, height);
    vertGradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    vertGradient.addColorStop(0.5, "rgba(255, 255, 255, 0)");
    vertGradient.addColorStop(0.5, "rgba(0, 0, 0, 0)");
    vertGradient.addColorStop(1, "rgba(0, 0, 0, 1)");
    ctx.fillStyle = vertGradient;
    ctx.fillRect(0, 0, width, height);
  };

  useEffect(() => {
    drawGradient();
  }, []);

  const pickColorAt = (x, y, rect) => {
    // Throttle slightly to avoid too many React updates
    const now = performance.now();
    if (now - lastPickTime.current < 20) return; // 50fps max
    lastPickTime.current = now;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const trueX = Math.round(x * scaleX);
    const trueY = Math.round(y * scaleY);

    if (trueX >= 0 && trueX <= canvas.width && trueY >= 0 && trueY <= canvas.height) {
      const safeX = Math.min(canvas.width - 1, trueX);
      const safeY = Math.min(canvas.height - 1, trueY);
      
      const imageData = ctx.getImageData(safeX, safeY, 1, 1).data;
      const r = imageData[0];
      const g = imageData[1];
      const b = imageData[2];
      const pickedHtmlColor = `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
      
      setColor(pickedHtmlColor);
      setIsEraser(false);
      setPickPos({ x, y });
    }
  };

  const handlePointerAct = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    pickColorAt(e.clientX - rect.left, e.clientY - rect.top, rect);
  };

  const handlePointerDown = (e) => {
    handlePointerAct(e);
    // Capture pointer events to track drags outside canvas
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (e.buttons > 0) { // mouse/touch is down
      handlePointerAct(e);
    }
  };

  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'relative', 
        width: '160px', 
        height: '44px', 
        borderRadius: '12px', 
        overflow: 'hidden',
        border: '2px solid var(--glass-border)',
        cursor: 'crosshair',
        flexShrink: 0,
        touchAction: 'none'
      }}
      title="Color Picker"
    >
      <canvas
        ref={canvasRef}
        width={160}
        height={44}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      />
      {pickPos && (!isEraser) && (
        <div style={{
          position: 'absolute',
          left: pickPos.x - 6,
          top: pickPos.y - 6,
          width: 12,
          height: 12,
          borderRadius: '50%',
          border: '2px solid white',
          boxShadow: '0 0 4px rgba(0,0,0,0.5)',
          pointerEvents: 'none'
        }} />
      )}
    </div>
  );
});

export default ColorPicker;

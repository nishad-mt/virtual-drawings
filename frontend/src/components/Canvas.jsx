import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

const Canvas = forwardRef(({ color, brushSize, isEraser, onDrawStart, boardColor = '#1e293b' }, ref) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const cursorCanvasRef = useRef(null);
  const cursorContextRef = useRef(null);
  
  // High performance refs (avoiding useState)
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const localColor = useRef(color);
  const localBrushSize = useRef(brushSize);
  const localIsEraser = useRef(isEraser);
  const localBoardColor = useRef(boardColor);
  
  // History
  const history = useRef([]);
  const historyPointer = useRef(-1);

  // Update internal refs when props change to avoid closure stale state
  useEffect(() => {
    localColor.current = color;
    localBrushSize.current = brushSize;
    localIsEraser.current = isEraser;
  }, [color, brushSize, isEraser]);

  // Update background when boardColor changes
  useEffect(() => {
    localBoardColor.current = boardColor;
  }, [boardColor]);

  const saveHistoryState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Keep history bounded to avoid memory leaks
    if (historyPointer.current < history.current.length - 1) {
      history.current = history.current.slice(0, historyPointer.current + 1);
    }
    
    const dataUrl = canvas.toDataURL();
    
    // Only push if drawing actually changed (prevents empty stack wiping)
    if (historyPointer.current >= 0 && history.current[historyPointer.current] === dataUrl) {
      return; 
    }
    
    history.current.push(dataUrl);
    if (history.current.length > 20) {
      history.current.shift();
    } else {
      historyPointer.current += 1;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    
    const initCanvas = () => {
      const rect = parent.getBoundingClientRect();
      // Handle high DPI
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Keep canvas transparent; background color is handled by CSS
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      contextRef.current = ctx;
      
      const cursorCanvas = cursorCanvasRef.current;
      if (cursorCanvas) {
        cursorCanvas.width = rect.width * dpr;
        cursorCanvas.height = rect.height * dpr;
        const cCtx = cursorCanvas.getContext('2d');
        cCtx.scale(dpr, dpr);
        cursorContextRef.current = cCtx;
      }
      
      // Save initial state
      if (history.current.length === 0) {
        saveHistoryState();
      } else {
        restoreState(history.current[historyPointer.current]);
      }
    };

    initCanvas();
    
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(initCanvas, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const restoreState = (dataUrl) => {
    if (!dataUrl) return;
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      // Clear before drawing
      const rect = canvas.parentElement.getBoundingClientRect();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
    };
  };

  // Expose API to parent
  useImperativeHandle(ref, () => ({
    drawCursor: (x, y) => {
      const canvas = cursorCanvasRef.current;
      const ctx = cursorContextRef.current;
      if (!canvas || !ctx) return;
      
      const rect = canvas.parentElement.getBoundingClientRect();
      const drawX = x * rect.width;
      const drawY = y * rect.height;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      
      // Calculate scaled size for arrow based on screen width
      const s = Math.max(0.6, (rect.width / 1200) * 0.8);
      
      // Draw standard mouse arrow geometry (adjusted relative to cursor tip)
      ctx.moveTo(drawX, drawY);
      ctx.lineTo(drawX, drawY + 16 * s);
      ctx.lineTo(drawX + 4 * s, drawY + 12 * s);
      ctx.lineTo(drawX + 8 * s, drawY + 20 * s);
      ctx.lineTo(drawX + 11 * s, drawY + 18.5 * s);
      ctx.lineTo(drawX + 6.5 * s, drawY + 10.5 * s);
      ctx.lineTo(drawX + 13 * s, drawY + 10 * s);
      ctx.closePath();

      // Subtle shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 4;

      // Fill with subtle opacity
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();

      // Reset shadow before stroke
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      ctx.strokeStyle = '#1e293b'; // Clear distinction from typical drawing colors
      ctx.lineWidth = Math.max(1, 1.5 * (s / 0.8));
      ctx.lineJoin = 'round';
      ctx.stroke();
    },
    clearCursor: () => {
      const canvas = cursorCanvasRef.current;
      const ctx = cursorContextRef.current;
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    },
    updatePausePosition: (x, y) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const drawX = x * rect.width;
      const drawY = y * rect.height;

      if (!contextRef.current.remotePoints) {
        contextRef.current.remotePoints = [{ x: drawX, y: drawY }];
      } else {
        const pts = contextRef.current.remotePoints;
        pts.push({ x: drawX, y: drawY });
        // Keep buffer small enough to maintain starting vector but avoid memory leak
        if (pts.length > 5) {
          pts.shift();
        }
      }
    },
    clearCanvas: () => {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      saveHistoryState();
    },
    saveAsImage: () => {
      const canvas = canvasRef.current;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tCtx = tempCanvas.getContext('2d');
      // Draw background
      tCtx.fillStyle = localBoardColor.current;
      tCtx.fillRect(0, 0, canvas.width, canvas.height);
      // Draw strokes
      tCtx.drawImage(canvas, 0, 0);

      const link = document.createElement('a');
      link.download = 'airdraw-export.png';
      link.href = tempCanvas.toDataURL('image/png');
      link.click();
    },
    undo: () => {
      if (historyPointer.current > 0) {
        historyPointer.current -= 1;
        restoreState(history.current[historyPointer.current]);
      }
    },
    redo: () => {
      if (historyPointer.current < history.current.length - 1) {
        historyPointer.current += 1;
        restoreState(history.current[historyPointer.current]);
      }
    },
    // API for WebSocket coordinates directly
    drawRemoteCoordinate: (x, y, isStart = false, isSimulation = false, colorOverride = null, forceEraser = false) => {
      // Assuming normalized coordinates (0 to 1) for cross-device compatibility
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (!canvas || !ctx) return;
      
      const rect = canvas.parentElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      
      const drawX = x * rect.width;
      const drawY = y * rect.height;

      const effectiveIsEraser = forceEraser || (localIsEraser.current && !isSimulation);
      ctx.globalCompositeOperation = effectiveIsEraser ? 'destination-out' : 'source-over';
      
      const effectiveColor = colorOverride || localColor.current;
      ctx.strokeStyle = effectiveColor;
      ctx.lineWidth = forceEraser ? 50 : localBrushSize.current;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (isStart) {
        contextRef.current.remotePoints = [{ x: drawX, y: drawY }];
        // Don't draw point immediately under strict mode, wait for 3 points
      } else {
        if (!contextRef.current.remotePoints) {
          contextRef.current.remotePoints = [{ x: drawX, y: drawY }];
        }
        
        const pts = contextRef.current.remotePoints;
        pts.push({ x: drawX, y: drawY });
        
        if (pts.length >= 3) {
          const p1 = pts[pts.length - 3];
          const p2 = pts[pts.length - 2];
          const p3 = pts[pts.length - 1];

          ctx.beginPath();
          
          if (pts.length === 3) {
            ctx.moveTo(p1.x, p1.y);
          } else {
            const prevMidX = (p1.x + p2.x) / 2;
            const prevMidY = (p1.y + p2.y) / 2;
            ctx.moveTo(prevMidX, prevMidY);
          }

          const midX = (p2.x + p3.x) / 2;
          const midY = (p2.y + p3.y) / 2;

          ctx.quadraticCurveTo(p2.x, p2.y, midX, midY);
          
          if (isSimulation) {
            ctx.shadowBlur = 24; 
            ctx.shadowColor = effectiveColor;
          }

          ctx.stroke();
          
          // Reset properties
          ctx.shadowBlur = 0;
          ctx.globalCompositeOperation = 'source-over';
        }
      }
    },
    endRemoteStroke: () => {
      saveHistoryState();
      if (contextRef.current) {
        contextRef.current.lastRemoteX = undefined;
        contextRef.current.lastRemoteY = undefined;
      }
    }

  }));

  // Native mouse/touch drawing for local interaction
  const startDrawing = (e) => {
    isDrawing.current = true;
    const { offsetX, offsetY } = getCoordinates(e);
    lastPos.current = { x: offsetX, y: offsetY };
    
    const ctx = contextRef.current;
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    // Draw a dot on click
    ctx.lineTo(offsetX, offsetY);
    ctx.globalCompositeOperation = localIsEraser.current ? 'destination-out' : 'source-over';
    ctx.strokeStyle = localColor.current;
    ctx.lineWidth = localBrushSize.current;
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    
    if (onDrawStart) onDrawStart();
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    const { offsetX, offsetY } = getCoordinates(e);
    
    const ctx = contextRef.current;
    ctx.lineTo(offsetX, offsetY);
    ctx.globalCompositeOperation = localIsEraser.current ? 'destination-out' : 'source-over';
    ctx.strokeStyle = localColor.current;
    ctx.lineWidth = localBrushSize.current;
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    
    lastPos.current = { x: offsetX, y: offsetY };
  };

  const stopDrawing = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      contextRef.current.closePath();
      saveHistoryState();
    }
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        offsetX: e.touches[0].clientX - rect.left,
        offsetY: e.touches[0].clientY - rect.top
      };
    }
    return {
      offsetX: e.nativeEvent.offsetX,
      offsetY: e.nativeEvent.offsetY
    };
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="canvas-element"
        style={{ backgroundColor: boardColor, transition: 'background-color 0.3s ease' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }}
        onTouchMove={(e) => { e.preventDefault(); draw(e); }}
        onTouchEnd={stopDrawing}
      />
      <canvas
        ref={cursorCanvasRef}
        className="canvas-element"
        style={{ pointerEvents: 'none', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />
    </>
  );
});

Canvas.displayName = 'Canvas';
export default Canvas;

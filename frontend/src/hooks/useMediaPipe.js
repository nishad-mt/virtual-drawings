import { useEffect, useRef, useState, useCallback } from 'react';

// Use globals provided by the CDN scripts in index.html to avoid Vite bundler errors
const Hands = window.Hands;
const Camera = window.Camera;

export function useMediaPipe(onGesture) {
  const [isReady, setIsReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  
  const videoRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);
  const requestRef = useRef(null);
  
  // Keep latest callback ref to avoid dependency cycles in useEffect
  const onGestureRef = useRef(onGesture);
  useEffect(() => {
    onGestureRef.current = onGesture;
  }, [onGesture]);

  const stableGestureRef = useRef('idle');
  const lastGestureRef = useRef('idle');
  const gestureStableCountRef = useRef(0);
  
  // Track continuous gesture events to prevent "repeated" triggers
  const lastEmittedGestureRef = useRef('idle');
  
  const prevX = useRef(0.0);
  const prevY = useRef(0.0);
  
  // Use a ref for actual camera state so synchronous calls don't race with React state
  const isActiveRef = useRef(false);

  const initializeHands = useCallback(async () => {
    if (handsRef.current) return;
    
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5
    });

    hands.onResults((results) => {
      let finalGesture = stableGestureRef.current;
      let finalX = prevX.current;
      let finalY = prevY.current;

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const lm = results.multiHandLandmarks[0];
        const handedness = results.multiHandedness[0].label;
        
        const fingers = [];
        if (handedness === "Right") {
          fingers.push(lm[4].x < lm[3].x ? 1 : 0);
        } else {
          fingers.push(lm[4].x > lm[3].x ? 1 : 0);
        }

        const tips = [8, 12, 16, 20];
        tips.forEach(tip => {
          fingers.push(lm[tip].y < lm[tip - 2].y ? 1 : 0);
        });

        let rawGesture = "idle";
        const total = fingers.reduce((a, b) => a + b, 0);
        
        if (total >= 4) {
          rawGesture = "erase";
        } else if (fingers[1] === 1 && fingers[2] === 0 && fingers[3] === 0 && fingers[4] === 0) {
          rawGesture = "draw";
        } else if (fingers[1] === 1 && fingers[2] === 1 && fingers[3] === 0 && fingers[4] === 0) {
          rawGesture = "stop";
        }
        
        if (rawGesture !== lastGestureRef.current) {
          gestureStableCountRef.current = 0;
        }
        gestureStableCountRef.current += 1;
        
        if (gestureStableCountRef.current >= 5) {
          stableGestureRef.current = rawGesture;
        }
        
        lastGestureRef.current = rawGesture;
        finalGesture = stableGestureRef.current;

        // Pointer: average of Index tip (8) and Index PIP (6)
        let rawX = (lm[8].x + lm[6].x) / 2.0;
        let rawY = (lm[8].y + lm[6].y) / 2.0;
        
        // Mirror horizontally
        rawX = 1.0 - rawX;

        // Optimized Exponential Smoothing (Removed double-smoothing array buffer for less lag)
        const dx = Math.abs(rawX - prevX.current);
        const dy = Math.abs(rawY - prevY.current);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Dynamic alpha: move faster if distance is larger (responsive), smooth more if tiny (anti-jitter)
        const alpha = distance > 0.05 ? 0.7 : 0.3;
        
        // If it's the very first frame (prev==0), jump directly to the raw coordinate to avoid flying in from (0,0)
        if (prevX.current === 0.0 && prevY.current === 0.0) {
          finalX = rawX;
          finalY = rawY;
        } else {
          finalX = prevX.current * (1 - alpha) + rawX * alpha;
          finalY = prevY.current * (1 - alpha) + rawY * alpha;
        }
        
        prevX.current = finalX;
        prevY.current = finalY;
        
      } else {
        // Hands lost: maintain last known position cleanly safely
        finalX = prevX.current;
        finalY = prevY.current;
      }

      // Event trigger logic: track if a gesture is newly established
      const isGestureStart = (finalGesture !== lastEmittedGestureRef.current);
      lastEmittedGestureRef.current = finalGesture;

      if (onGestureRef.current) {
        onGestureRef.current({ 
          gesture: finalGesture, 
          x: finalX, 
          y: finalY,
          isGestureStart
        });
      }
    });

    handsRef.current = hands;
    
    // Asynchronous warmup: Preload WASM and force ML graph initialization
    // by evaluating a 1x1 blank canvas before the user ever triggers the camera.
    try {
      if (typeof hands.initialize === 'function') {
        await hands.initialize();
      }
      const dummyCanvas = document.createElement('canvas');
      dummyCanvas.width = 1;
      dummyCanvas.height = 1;
      await hands.send({ image: dummyCanvas });
      console.log('MediaPipe Hands engine preloaded and warmed up.');
    } catch (err) {
      console.warn("Preload warmup skipped/failed:", err);
    }
    
    // Only set ready once the backend is completely initialized and loaded
    setIsReady(true);
  }, []);

  useEffect(() => {
    // Only initialize if globals are gracefully loaded from CDN
    if (typeof Hands !== 'undefined') {
      initializeHands();
    } else {
      console.error("MediaPipe Hands JS is missing. Check CDN script in index.html");
    }
    
    return () => {
      if (handsRef.current) {
        handsRef.current.close().catch(()=>console.warn('Closing hands failed.'));
        handsRef.current = null; // Fix memory leak and double-init in StrictMode
      }
    };
  }, [initializeHands]);

  const startCamera = useCallback(async () => {
    if (!videoRef.current || !handsRef.current || isActiveRef.current) return;
    
    isActiveRef.current = true;
    setIsActive(true);
    
    try {
      // 1. Instantly get raw feed and show it to user
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      videoRef.current.srcObject = stream;
      
      // Wait for the video to actually start playing
      await new Promise(resolve => {
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(resolve).catch(resolve);
        };
      });

      // 2. Start our own decoupled processing loop
      const processFrame = async () => {
        if (!isActiveRef.current || !videoRef.current) return;
        
        try {
          if (videoRef.current.readyState >= 2) { 
            await handsRef.current.send({ image: videoRef.current });
          }
        } catch (err) {
          console.error("Frame processing error:", err);
        }
        
        requestRef.current = requestAnimationFrame(processFrame);
      };
      
      // Delay ML thread slightly to let React render the camera layout smoothly
      setTimeout(() => {
        if (isActiveRef.current) {
           processFrame();
        }
      }, 300);

      // Save stream info for cleanup
      cameraRef.current = {
        stop: () => {
          stream.getTracks().forEach(track => track.stop());
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
          if (videoRef.current) videoRef.current.srcObject = null;
        }
      };

    } catch (err) {
      console.error("Camera failed to start natively:", err);
      isActiveRef.current = false;
      setIsActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    isActiveRef.current = false;
    setIsActive(false);
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  return { isReady, isActive, videoRef, startCamera, stopCamera };
}

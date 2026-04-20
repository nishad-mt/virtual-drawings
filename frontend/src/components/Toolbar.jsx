import React from 'react';
import { Trash2, Eraser, Pen, Download, Undo, Redo, Circle } from 'lucide-react';
import ColorPicker from './ColorPicker';

const BRUSH_SIZES = [
  { id: 'small', size: 2 },
  { id: 'medium', size: 8 },
  { id: 'large', size: 16 }
];

export default function Toolbar({ 
  colorPickerRef,
  color, 
  setColor, 
  brushSize, 
  setBrushSize, 
  isEraser, 
  setIsEraser, 
  clearCanvas,
  saveCanvas,
  undo,
  redo
}) {
  return (
    <div className="toolbar glass-panel">
      {/* Colors */}
      <div className="toolbar-section">
        <ColorPicker
          ref={colorPickerRef}
          color={color}
          setColor={setColor}
          isEraser={isEraser}
          setIsEraser={setIsEraser}
        />
      </div>

      <div className="divider" />

      {/* Brush tools */}
      <div className="toolbar-section">
        <button 
          className={`btn-icon ${!isEraser ? 'active' : ''}`}
          onClick={() => setIsEraser(false)}
          title="Pen Tool"
        >
          <Pen size={20} />
        </button>
        <button 
          className={`btn-icon ${isEraser ? 'active' : ''}`}
          onClick={() => setIsEraser(true)}
          title="Eraser Tool"
        >
          <Eraser size={20} />
        </button>
      </div>

      <div className="divider" />

      {/* Brush sizes */}
      <div className="toolbar-section">
        {BRUSH_SIZES.map((b) => (
          <button
            key={b.id}
            className={`btn-icon brush-size-btn ${brushSize === b.size ? 'active' : ''}`}
            onClick={() => setBrushSize(b.size)}
            title={`${b.id} brush`}
          >
            <div className={`brush-dot ${b.id}`}></div>
          </button>
        ))}
      </div>

      <div className="divider" />

      {/* Actions */}
      <div className="toolbar-section">
        <button className="btn-icon" onClick={undo} title="Undo">
          <Undo size={20} />
        </button>
        <button className="btn-icon" onClick={redo} title="Redo">
          <Redo size={20} />
        </button>
        <button className="btn-icon" onClick={clearCanvas} title="Clear Canvas">
          <Trash2 size={20} />
        </button>
        <button className="btn-icon" onClick={saveCanvas} title="Save Application">
          <Download size={20} />
        </button>
      </div>
    </div>
  );
}

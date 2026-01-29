import { useState, useRef, useCallback, useEffect } from 'react';
import type { Note as NoteType, CanvasState } from '@/types/note';
import { Note } from './Note';
import { Plus, ZoomIn, ZoomOut, Move, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CanvasProps {
  notes: NoteType[];
  selectedNoteId: string | null;
  onAddNote: (x: number, y: number, color: string) => void;
  onUpdateNote: (id: string, updates: Partial<NoteType>) => void;
  onDeleteNote: (id: string) => void;
  onSelectNote: (id: string | null) => void;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
const ZOOM_STEP = 0.1;

const NOTE_COLORS = [
  'yellow', 'blue', 'green', 'pink', 'purple', 'orange'
];

export function Canvas({ 
  notes, 
  selectedNoteId, 
  onAddNote, 
  onUpdateNote, 
  onDeleteNote, 
  onSelectNote 
}: CanvasProps) {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [nextColorIndex, setNextColorIndex] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ x: 0, y: 0 });
  const canvasStartRef = useRef({ x: 0, y: 0 });

  // Handle canvas panning
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan with middle mouse button or when clicking on empty canvas
    if (e.button === 1 || (e.button === 0 && e.target === canvasRef.current)) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      canvasStartRef.current = { x: canvasState.offsetX, y: canvasState.offsetY };
      onSelectNote(null);
    }
  }, [canvasState.offsetX, canvasState.offsetY, onSelectNote]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;
      
      const deltaX = e.clientX - panStartRef.current.x;
      const deltaY = e.clientY - panStartRef.current.y;
      
      setCanvasState(prev => ({
        ...prev,
        offsetX: canvasStartRef.current.x + deltaX,
        offsetY: canvasStartRef.current.y + deltaY,
      }));
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, canvasState.scale + delta));
      
      // Zoom towards mouse position
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const scaleRatio = newScale / canvasState.scale;
        
        setCanvasState(prev => ({
          scale: newScale,
          offsetX: mouseX - (mouseX - prev.offsetX) * scaleRatio,
          offsetY: mouseY - (mouseY - prev.offsetY) * scaleRatio,
        }));
      }
    }
  }, [canvasState.scale]);

  // Zoom controls
  const zoomIn = () => {
    setCanvasState(prev => ({
      ...prev,
      scale: Math.min(MAX_SCALE, prev.scale + ZOOM_STEP),
    }));
  };

  const zoomOut = () => {
    setCanvasState(prev => ({
      ...prev,
      scale: Math.max(MIN_SCALE, prev.scale - ZOOM_STEP),
    }));
  };

  const resetZoom = () => {
    setCanvasState(prev => ({
      ...prev,
      scale: 1,
    }));
  };

  const centerCanvas = () => {
    setCanvasState({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    });
  };

  // Add note at center of viewport
  const handleAddNote = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = (rect.width / 2 - canvasState.offsetX) / canvasState.scale;
      const centerY = (rect.height / 2 - canvasState.offsetY) / canvasState.scale;
      
      const color = NOTE_COLORS[nextColorIndex % NOTE_COLORS.length];
      setNextColorIndex(prev => prev + 1);
      
      onAddNote(centerX - 150, centerY - 100, color);
    }
  };

  // Handle double click to add note
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - canvasState.offsetX) / canvasState.scale;
      const y = (e.clientY - rect.top - canvasState.offsetY) / canvasState.scale;
      
      const color = NOTE_COLORS[nextColorIndex % NOTE_COLORS.length];
      setNextColorIndex(prev => prev + 1);
      
      onAddNote(x - 150, y - 50, color);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-50">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle, #cbd5e1 1px, transparent 1px)
          `,
          backgroundSize: `${20 * canvasState.scale}px ${20 * canvasState.scale}px`,
          backgroundPosition: `${canvasState.offsetX}px ${canvasState.offsetY}px`,
        }}
      />

      {/* Canvas Container */}
      <div
        ref={canvasRef}
        className={`absolute inset-0 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleCanvasMouseDown}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      >
        {/* Transform Container */}
        <div
          className="absolute origin-top-left"
          style={{
            transform: `translate(${canvasState.offsetX}px, ${canvasState.offsetY}px) scale(${canvasState.scale})`,
          }}
        >
          {/* Notes */}
          {notes.map(note => (
            <Note
              key={note.id}
              note={note}
              isSelected={note.id === selectedNoteId}
              onUpdate={onUpdateNote}
              onDelete={onDeleteNote}
              onSelect={onSelectNote}
              canvasScale={canvasState.scale}
            />
          ))}
        </div>
      </div>

      {/* UI Controls */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="bg-white rounded-lg shadow-md border border-slate-200 p-2 flex items-center gap-2">
          <MousePointer2 className="w-5 h-5 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Infinite Notepad</span>
        </div>
      </div>

      {/* Add Note Button */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2">
        <Button
          onClick={handleAddNote}
          className="shadow-lg hover:shadow-xl transition-shadow bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Note
        </Button>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <div className="bg-white rounded-lg shadow-md border border-slate-200 p-1 flex flex-col gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomIn}
            className="h-9 w-9"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetZoom}
            className="h-9 text-xs font-mono"
          >
            {Math.round(canvasState.scale * 100)}%
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomOut}
            className="h-9 w-9"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Bottom Left Controls */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        <div className="bg-white rounded-lg shadow-md border border-slate-200 p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={centerCanvas}
            className="text-xs"
          >
            <Move className="w-4 h-4 mr-2" />
            Center View
          </Button>
        </div>
        <div className="text-xs text-slate-500 bg-white/80 rounded px-2 py-1">
          {notes.length} note{notes.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-400 bg-white/80 rounded-lg px-4 py-2">
        Double-click to add note • Drag to pan • Ctrl+Scroll to zoom • Drag notes to move
      </div>
    </div>
  );
}

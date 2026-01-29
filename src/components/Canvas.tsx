import { useState, useRef, useCallback, useEffect } from 'react';
import type { Note as NoteType, CanvasState } from '@/types/note';
import { Note } from './Note';
import { Plus, ZoomIn, ZoomOut, Share2, ChevronRight, Layers as LayersIcon } from 'lucide-react';
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
  'navy', 'teal', 'navy', 'teal', 'navy', 'teal'
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
    <div className="relative w-full h-screen overflow-hidden flex flex-col">
      {/* Top Toolbar */}
      <div className="h-14 bg-gray-900 border-b border-gray-700 flex items-center px-4 gap-3 z-20">
        <Button
          onClick={handleAddNote}
          className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 h-8 text-sm"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Text Frame
        </Button>

        <div className="flex items-center gap-2 ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomOut}
            className="h-8 w-8 text-white hover:bg-gray-800"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-white text-sm font-mono min-w-[3rem] text-center">
            {Math.round(canvasState.scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomIn}
            className="h-8 w-8 text-white hover:bg-gray-800"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1" />

        <Button
          className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 h-8 text-sm"
          size="sm"
        >
          <Share2 className="w-4 h-4 mr-1.5" />
          Share
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Layers Panel */}
        <div className="w-40 bg-gray-100 border-r border-gray-300 overflow-y-auto">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <LayersIcon className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Layers</span>
            </div>
            <div className="space-y-1">
              {notes.map((note, index) => (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note.id)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer text-xs hover:bg-gray-200 ${
                    note.id === selectedNoteId ? 'bg-gray-200' : ''
                  }`}
                >
                  <ChevronRight className="w-3 h-3 text-gray-500" />
                  <span className="text-gray-700">Layer {notes.length - index}</span>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="text-xs text-gray-400 px-2 py-3">No layers yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative dotted-bg">
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
        </div>
      </div>
    </div>
  );
}

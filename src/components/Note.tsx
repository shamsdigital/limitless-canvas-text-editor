import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import type { Note as NoteType } from '@/types/note';
import { X, GripVertical, Bold, Italic, List, Heading2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NoteProps {
  note: NoteType;
  isSelected: boolean;
  onUpdate: (id: string, updates: Partial<NoteType>) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  canvasScale: number;
}

const NOTE_COLORS: Record<string, { bg: string; border: string; hover: string }> = {
  yellow: { bg: 'bg-yellow-100', border: 'border-yellow-300', hover: 'hover:border-yellow-400' },
  blue: { bg: 'bg-blue-100', border: 'border-blue-300', hover: 'hover:border-blue-400' },
  green: { bg: 'bg-green-100', border: 'border-green-300', hover: 'hover:border-green-400' },
  pink: { bg: 'bg-pink-100', border: 'border-pink-300', hover: 'hover:border-pink-400' },
  purple: { bg: 'bg-purple-100', border: 'border-purple-300', hover: 'hover:border-purple-400' },
  orange: { bg: 'bg-orange-100', border: 'border-orange-300', hover: 'hover:border-orange-400' },
};

export function Note({ note, isSelected, onUpdate, onDelete, onSelect, canvasScale }: NoteProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const noteStartRef = useRef({ x: 0, y: 0 });
  const noteRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Type your note...',
      }),
    ],
    content: note.content,
    onUpdate: ({ editor }) => {
      onUpdate(note.id, { content: editor.getHTML() });
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[80px]',
      },
    },
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.note-toolbar') || 
        (e.target as HTMLElement).closest('.note-delete') ||
        (e.target as HTMLElement).closest('.ProseMirror')) {
      return;
    }
    
    e.stopPropagation();
    onSelect(note.id);
    setIsDragging(true);
    
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    noteStartRef.current = { x: note.x, y: note.y };
  }, [note.id, note.x, note.y, onSelect]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = (e.clientX - dragStartRef.current.x) / canvasScale;
      const deltaY = (e.clientY - dragStartRef.current.y) / canvasScale;
      
      onUpdate(note.id, {
        x: noteStartRef.current.x + deltaX,
        y: noteStartRef.current.y + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, note.id, onUpdate, canvasScale]);

  const colorTheme = NOTE_COLORS[note.color] || NOTE_COLORS[0];

  const toggleHeading = () => {
    editor?.chain().focus().toggleHeading({ level: 2 }).run();
  };

  const toggleBold = () => {
    editor?.chain().focus().toggleBold().run();
  };

  const toggleItalic = () => {
    editor?.chain().focus().toggleItalic().run();
  };

  const toggleBulletList = () => {
    editor?.chain().focus().toggleBulletList().run();
  };

  return (
    <div
      ref={noteRef}
      className={`absolute rounded-lg shadow-lg transition-shadow ${colorTheme.bg} ${colorTheme.border} border-2 ${colorTheme.hover}
        ${isSelected ? 'ring-2 ring-blue-500 shadow-xl' : ''} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        minHeight: note.height,
      }}
      onMouseDown={handleMouseDown}
      onClick={() => onSelect(note.id)}
    >
      {/* Header with drag handle and controls */}
      <div className="flex items-center justify-between p-2 border-b border-black/10 note-header">
        <div className="flex items-center gap-1">
          <GripVertical className="w-4 h-4 text-black/40" />
          
          {/* Formatting Toolbar */}
          <div className="note-toolbar flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 ${editor?.isActive('heading') ? 'bg-black/10' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleHeading(); }}
            >
              <Heading2 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 ${editor?.isActive('bold') ? 'bg-black/10' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleBold(); }}
            >
              <Bold className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 ${editor?.isActive('italic') ? 'bg-black/10' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleItalic(); }}
            >
              <Italic className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 ${editor?.isActive('bulletList') ? 'bg-black/10' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleBulletList(); }}
            >
              <List className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="note-delete h-6 w-6 text-black/40 hover:text-red-500 hover:bg-red-50"
          onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className="p-3">
        <EditorContent 
          editor={editor} 
          className="prose prose-sm max-w-none"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={(e) => {
          e.stopPropagation();
          const startX = e.clientX;
          const startY = e.clientY;
          const startWidth = note.width;
          const startHeight = note.height;

          const handleResize = (e: MouseEvent) => {
            const deltaX = (e.clientX - startX) / canvasScale;
            const deltaY = (e.clientY - startY) / canvasScale;
            onUpdate(note.id, {
              width: Math.max(200, startWidth + deltaX),
              height: Math.max(100, startHeight + deltaY),
            });
          };

          const stopResize = () => {
            window.removeEventListener('mousemove', handleResize);
            window.removeEventListener('mouseup', stopResize);
          };

          window.addEventListener('mousemove', handleResize);
          window.addEventListener('mouseup', stopResize);
        }}
      >
        <svg className="w-3 h-3 text-black/30" viewBox="0 0 10 10">
          <path d="M0 10L10 0M5 10L10 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    </div>
  );
}

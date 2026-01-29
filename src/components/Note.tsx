import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import type { Note as NoteType } from '@/types/note';
import { X, GripVertical, Bold, Italic, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NoteProps {
  note: NoteType;
  isSelected: boolean;
  onUpdate: (id: string, updates: Partial<NoteType>) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  canvasScale: number;
}

const NOTE_COLORS: Record<string, { bg: string; header: string; text: string }> = {
  navy: { bg: 'bg-slate-800', header: 'bg-slate-900', text: 'text-white' },
  teal: { bg: 'bg-teal-700', header: 'bg-teal-800', text: 'text-white' },
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

  const colorTheme = NOTE_COLORS[note.color] || NOTE_COLORS['navy'];

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
      className={`absolute rounded-lg shadow-xl overflow-hidden ${colorTheme.bg}
        ${isSelected ? 'ring-2 ring-blue-400' : ''} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
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
      <div className={`flex items-center justify-between px-3 py-2 ${colorTheme.header} note-header`}>
        <div className="flex items-center gap-2 flex-1">
          <GripVertical className="w-4 h-4 text-white/40" />
          <span className="text-xs text-white/70">Inter</span>

          {/* Formatting Toolbar */}
          <div className="note-toolbar flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 text-white/70 hover:text-white hover:bg-white/10 ${editor?.isActive('bold') ? 'bg-white/20' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleBold(); }}
            >
              <Bold className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 text-white/70 hover:text-white hover:bg-white/10 ${editor?.isActive('italic') ? 'bg-white/20' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleItalic(); }}
            >
              <Italic className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 text-white/70 hover:text-white hover:bg-white/10 ${editor?.isActive('bulletList') ? 'bg-white/20' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleBulletList(); }}
            >
              <List className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="note-delete h-6 w-6 text-white/50 hover:text-white hover:bg-white/10"
          onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className={`p-4 ${colorTheme.text}`}>
        <EditorContent
          editor={editor}
          className="prose prose-sm prose-invert max-w-none"
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
        <svg className="w-3 h-3 text-white/30" viewBox="0 0 10 10">
          <path d="M0 10L10 0M5 10L10 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    </div>
  );
}

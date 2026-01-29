import { useState, useCallback } from 'react';
import { Canvas } from '@/components/Canvas';
import type { Note } from '@/types/note';
import { Toaster, toast } from 'sonner';

const NOTE_COLORS = [
  'yellow', 'blue', 'green', 'pink', 'purple', 'orange'
];

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [nextColorIndex, setNextColorIndex] = useState(0);

  // Generate unique ID
  const generateId = () => {
    return `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Add a new note
  const handleAddNote = useCallback((x: number, y: number, noteColor?: string) => {
    const color = noteColor || NOTE_COLORS[nextColorIndex % NOTE_COLORS.length];
    setNextColorIndex(prev => prev + 1);
    
    const newNote: Note = {
      id: generateId(),
      x,
      y,
      content: '',
      width: 300,
      height: 200,
      color,
      createdAt: Date.now(),
    };
    
    setNotes(prev => [...prev, newNote]);
    setSelectedNoteId(newNote.id);
    toast.success('Note created!');
  }, [nextColorIndex]);

  // Update a note
  const handleUpdateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev => 
      prev.map(note => 
        note.id === id ? { ...note, ...updates } : note
      )
    );
  }, []);

  // Delete a note
  const handleDeleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
    if (selectedNoteId === id) {
      setSelectedNoteId(null);
    }
    toast.info('Note deleted');
  }, [selectedNoteId]);

  // Select a note
  const handleSelectNote = useCallback((id: string | null) => {
    setSelectedNoteId(id);
  }, []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Delete selected note with Delete or Backspace key
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNoteId) {
      // Don't delete if user is typing in an input
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          (e.target as HTMLElement).isContentEditable) {
        return;
      }
      handleDeleteNote(selectedNoteId);
    }
    
    // Escape to deselect
    if (e.key === 'Escape') {
      setSelectedNoteId(null);
    }
  }, [selectedNoteId, handleDeleteNote]);

  return (
    <div 
      className="w-full h-screen overflow-hidden"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <Canvas
        notes={notes}
        selectedNoteId={selectedNoteId}
        onAddNote={handleAddNote}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
        onSelectNote={handleSelectNote}
      />
      <Toaster position="bottom-center" />
    </div>
  );
}

export default App;

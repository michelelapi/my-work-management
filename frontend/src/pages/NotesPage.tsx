import React, { useEffect, useMemo, useState } from 'react';
import { FaTrash } from "@react-icons/all-files/fa/FaTrash";
import NotesModal from '../components/NotesModal';
import noteService from '../services/noteService';
import { Note } from '../types/note';

const NOTES_UPDATED_EVENT = 'notes-updated';

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [draftContent, setDraftContent] = useState('');

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()),
    [notes]
  );

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedNotes = await noteService.getNotes(0, 200, 'creationDate,desc');
      setNotes(fetchedNotes);
    } catch (err) {
      console.error('Error loading notes:', err);
      setError('Failed to load notes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const dispatchNotesUpdatedEvent = () => {
    window.dispatchEvent(new Event(NOTES_UPDATED_EVENT));
  };

  const handleCreateNote = async () => {
    try {
      setError(null);
      await noteService.createNote(draftContent.trim());
      setDraftContent('');
      setIsCreateModalOpen(false);
      await loadNotes();
      dispatchNotesUpdatedEvent();
    } catch (err) {
      console.error('Error creating note:', err);
      setError('Failed to create note.');
    }
  };

  const handleOpenNote = async (note: Note) => {
    setSelectedNote(note);
    setIsViewModalOpen(true);

    if (!note.readTick) {
      try {
        const updated = await noteService.updateReadStatus(note.id, { readTick: true });
        setNotes((prev) => prev.map((item) => (item.id === note.id ? updated : item)));
        setSelectedNote(updated);
        dispatchNotesUpdatedEvent();
      } catch (err) {
        console.error('Error marking note as read:', err);
        setError('Failed to mark note as read.');
      }
    }
  };

  const handleToggleReadStatus = async (note: Note, checked: boolean) => {
    try {
      const updated = await noteService.updateReadStatus(note.id, { readTick: checked });
      setNotes((prev) => prev.map((item) => (item.id === note.id ? updated : item)));
      if (selectedNote?.id === note.id) {
        setSelectedNote(updated);
      }
      dispatchNotesUpdatedEvent();
    } catch (err) {
      console.error('Error updating note read status:', err);
      setError('Failed to update note status.');
    }
  };

  const handleDeleteNote = async (note: Note) => {
    const confirmed = window.confirm('Are you sure you want to delete this note?');
    if (!confirmed) {
      return;
    }

    try {
      await noteService.deleteNote(note.id);
      setNotes((prev) => prev.filter((item) => item.id !== note.id));
      if (selectedNote?.id === note.id) {
        setSelectedNote(null);
        setIsViewModalOpen(false);
      }
      dispatchNotesUpdatedEvent();
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note.');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading notes...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-end items-center mb-6">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-md transition-colors font-medium shadow-md hover:shadow-lg"
        >
          Create New Note
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {sortedNotes.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
          No notes found. Create your first note.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg">
          <table className="min-w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="w-20 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Read</th>
                <th className="w-52 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Creation Date</th>
                <th className="w-52 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Read Date</th>
                <th className="w-auto px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Note</th>
                <th className="w-20 px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedNotes.map((note) => (
                <tr
                  key={note.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleOpenNote(note)}
                >
                  <td className="w-20 px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={note.readTick}
                      onChange={(e) => handleToggleReadStatus(note, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="w-52 px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(note.creationDate).toLocaleString()}
                  </td>
                  <td className="w-52 px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {note.readDate ? new Date(note.readDate).toLocaleString() : '-'}
                  </td>
                  <td className="w-auto px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="w-full truncate" title={note.content}>{note.content}</div>
                  </td>
                  <td className="w-20 px-6 py-4 text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDeleteNote(note)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title="Delete note"
                    >
                      <FaTrash size={16} className="inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NotesModal
        isOpen={isCreateModalOpen}
        mode="create"
        note={null}
        draftContent={draftContent}
        onDraftChange={setDraftContent}
        onSave={handleCreateNote}
        onClose={() => {
          setIsCreateModalOpen(false);
          setDraftContent('');
        }}
      />

      <NotesModal
        isOpen={isViewModalOpen}
        mode="view"
        note={selectedNote}
        draftContent=""
        onDraftChange={() => null}
        onSave={() => null}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedNote(null);
        }}
      />
    </div>
  );
};

export default NotesPage;

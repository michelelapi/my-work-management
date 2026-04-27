import React from 'react';
import { Note } from '../types/note';

interface NotesModalProps {
  isOpen: boolean;
  mode: 'create' | 'view';
  note: Note | null;
  draftContent: string;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

const NotesModal: React.FC<NotesModalProps> = ({
  isOpen,
  mode,
  note,
  draftContent,
  onDraftChange,
  onSave,
  onClose
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {mode === 'create' ? 'Create New Note' : 'Note Details'}
        </h3>

        {mode === 'create' ? (
          <textarea
            value={draftContent}
            onChange={(e) => onDraftChange(e.target.value)}
            rows={10}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Write your note here..."
          />
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Created: {note?.creationDate ? new Date(note.creationDate).toLocaleString() : '-'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Read: {note?.readTick ? 'Yes' : 'No'}
              {note?.readDate ? ` (${new Date(note.readDate).toLocaleString()})` : ''}
            </div>
            <div className="border border-gray-200 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-gray-700 whitespace-pre-wrap text-gray-900 dark:text-white">
              {note?.content}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            {mode === 'create' ? 'Cancel' : 'Close'}
          </button>
          {mode === 'create' && (
            <button
              onClick={onSave}
              disabled={!draftContent.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Save Note
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesModal;

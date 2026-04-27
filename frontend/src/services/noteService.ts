import api from './api';
import { Note, NoteReadStatusUpdate } from '../types/note';

interface PageResponse<T> {
  content: T[];
}

interface UnreadCountResponse {
  count: number;
}

const noteService = {
  async getNotes(page: number = 0, size: number = 100, sort: string = 'creationDate,desc'): Promise<Note[]> {
    const response = await api.get<PageResponse<Note>>('/notes', {
      params: { page, size, sort }
    });
    return response.data.content || [];
  },

  async createNote(content: string): Promise<Note> {
    const response = await api.post<Note>('/notes', { content });
    return response.data;
  },

  async updateReadStatus(noteId: number, payload: NoteReadStatusUpdate): Promise<Note> {
    const response = await api.patch<Note>(`/notes/${noteId}/read-status`, payload);
    return response.data;
  },

  async deleteNote(noteId: number): Promise<void> {
    await api.delete(`/notes/${noteId}`);
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<UnreadCountResponse>('/notes/unread-count');
    return response.data.count ?? 0;
  }
};

export default noteService;

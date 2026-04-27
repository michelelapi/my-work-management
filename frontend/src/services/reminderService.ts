import api from './api';
import { ActivityReminder, ReminderCreatePayload, ReminderPreflightResponse } from '../types/reminder';

interface PageResponse<T> {
  content: T[];
}

const reminderService = {
  async getActivities(): Promise<string[]> {
    const response = await api.get<string[]>('/reminders/activities');
    return response.data || [];
  },

  async getReminders(page: number = 0, size: number = 100, sort: string = 'creationDate,desc'): Promise<ActivityReminder[]> {
    const response = await api.get<PageResponse<ActivityReminder>>('/reminders', {
      params: { page, size, sort }
    });
    return response.data.content || [];
  },

  async createReminder(payload: ReminderCreatePayload): Promise<ActivityReminder> {
    const response = await api.post<ActivityReminder>('/reminders', payload);
    return response.data;
  },

  async completeReminder(reminderId: number): Promise<ActivityReminder> {
    const response = await api.patch<ActivityReminder>(`/reminders/${reminderId}/complete`);
    return response.data;
  },

  async preflight(method: string, path: string): Promise<ReminderPreflightResponse> {
    const response = await api.get<ReminderPreflightResponse>('/reminders/preflight', {
      params: { method, path }
    });
    return response.data;
  }
};

export default reminderService;

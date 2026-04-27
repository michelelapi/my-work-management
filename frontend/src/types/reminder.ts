export interface ActivityReminder {
  id: number;
  activityName: string;
  message: string;
  active: boolean;
  creationDate: string;
  completedDate?: string | null;
}

export interface ReminderPreflightResponse {
  shouldShowReminder: boolean;
  reminder: ActivityReminder | null;
}

export interface ReminderCreatePayload {
  activityName: string;
  message: string;
}

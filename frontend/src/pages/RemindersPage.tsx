import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaCheck } from "@react-icons/all-files/fa/FaCheck";
import reminderService from '../services/reminderService';
import { ActivityReminder } from '../types/reminder';

const REMINDERS_UPDATED_EVENT = 'reminders-updated';

const RemindersPage: React.FC = () => {
  const [reminders, setReminders] = useState<ActivityReminder[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedReminders = useMemo(
    () => [...reminders].sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()),
    [reminders]
  );

  const dispatchRemindersUpdatedEvent = () => {
    window.dispatchEvent(new Event(REMINDERS_UPDATED_EVENT));
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedActivities, fetchedReminders] = await Promise.all([
        reminderService.getActivities(),
        reminderService.getReminders(0, 200, 'creationDate,desc')
      ]);

      setActivities(fetchedActivities);
      setReminders(fetchedReminders);
      if (fetchedActivities.length > 0) {
        setSelectedActivity((prev) => prev || fetchedActivities[0]);
      }
    } catch (err) {
      console.error('Error loading reminders:', err);
      setError('Failed to load reminders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateReminder = async () => {
    const trimmedMessage = message.trim();
    if (!selectedActivity) {
      setError('Please select an activity.');
      return;
    }
    if (!trimmedMessage) {
      setError('Reminder message is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const created = await reminderService.createReminder({
        activityName: selectedActivity,
        message: trimmedMessage
      });
      setReminders((prev) => [created, ...prev]);
      setMessage('');
      dispatchRemindersUpdatedEvent();
    } catch (err) {
      console.error('Error creating reminder:', err);
      setError('Failed to create reminder.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteReminder = async (reminderId: number) => {
    try {
      setError(null);
      await reminderService.completeReminder(reminderId);
      setReminders((prev) => prev.filter((item) => item.id !== reminderId));
      dispatchRemindersUpdatedEvent();
    } catch (err) {
      console.error('Error completing reminder:', err);
      setError('Failed to complete reminder.');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading reminders...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Activity Reminders</h1>
        <button
          onClick={handleCreateReminder}
          disabled={submitting || activities.length === 0}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
        >
          {submitting ? 'Creating...' : 'Create Reminder'}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-lg font-medium mb-4">Create Reminder</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">Activity</label>
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
            >
              {activities.length === 0 && <option value="">No activities configured</option>}
              {activities.map((activity) => (
                <option key={activity} value={activity}>
                  {activity}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Reminder Message</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Remember to call xxx"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
              maxLength={1000}
            />
          </div>
        </div>
      </div>

      {sortedReminders.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
          No active reminders found.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Message</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedReminders.map((reminder) => (
                <tr key={reminder.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(reminder.creationDate).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {reminder.activityName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {reminder.message}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleCompleteReminder(reminder.id)}
                      className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                      title="Mark as done"
                    >
                      <FaCheck size={16} className="inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RemindersPage;

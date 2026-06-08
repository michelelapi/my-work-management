import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: `${config.api.companyServiceUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const reminderApi = axios.create({
  baseURL: `${config.api.companyServiceUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const REMINDER_ENDPOINT_PREFIX = '/reminders';

const buildRequestPath = (requestUrl?: string, baseUrl?: string): string | null => {
  if (!requestUrl) {
    return null;
  }

  try {
    const normalizedBase = baseUrl ?? `${config.api.companyServiceUrl}/api`;
    const absolute = requestUrl.startsWith('http')
      ? new URL(requestUrl)
      : new URL(requestUrl, normalizedBase);
    return absolute.pathname.replace('/api', '') || '/';
  } catch {
    const noQuery = requestUrl.split('?')[0];
    return noQuery.startsWith('/') ? noQuery : `/${noQuery}`;
  }
};

const shouldSkipReminderCheck = (requestPath: string | null): boolean => {
  if (!requestPath) {
    return true;
  }
  return requestPath.startsWith(REMINDER_ENDPOINT_PREFIX);
};

type ReminderModalButton = {
  label: string;
  primary?: boolean;
  onClick: () => void;
};

const showReminderModal = (
  titleText: string,
  message: string,
  buttons: ReminderModalButton[]
): Promise<void> => {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0, 0, 0, 0.45)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '99999';

    const modal = document.createElement('div');
    modal.style.width = 'min(560px, 92vw)';
    modal.style.background = '#ffffff';
    modal.style.borderRadius = '8px';
    modal.style.padding = '20px';
    modal.style.boxShadow = '0 10px 35px rgba(0, 0, 0, 0.25)';
    modal.style.fontFamily = 'sans-serif';

    const title = document.createElement('h3');
    title.textContent = titleText;
    title.style.margin = '0 0 10px 0';
    title.style.fontSize = '18px';
    title.style.fontWeight = '600';

    const content = document.createElement('p');
    content.textContent = message;
    content.style.margin = '0 0 18px 0';
    content.style.whiteSpace = 'pre-wrap';
    content.style.color = '#1f2937';

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.justifyContent = 'flex-end';
    actions.style.gap = '10px';
    actions.style.flexWrap = 'wrap';

    const cleanup = () => {
      document.removeEventListener('keydown', onEsc);
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      resolve();
    };

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const cancelButton = buttons[0];
        cancelButton.onClick();
        cleanup();
      }
    };

    buttons.forEach((buttonConfig) => {
      const button = document.createElement('button');
      button.textContent = buttonConfig.label;
      button.style.padding = '8px 14px';
      button.style.borderRadius = '6px';
      button.style.cursor = 'pointer';

      if (buttonConfig.primary) {
        button.style.border = 'none';
        button.style.background = '#2563eb';
        button.style.color = '#ffffff';
      } else {
        button.style.border = '1px solid #9ca3af';
        button.style.background = '#f3f4f6';
      }

      button.onclick = () => {
        buttonConfig.onClick();
        cleanup();
      };
      actions.appendChild(button);
    });

    overlay.onclick = (event) => {
      if (event.target === overlay) {
        buttons[0].onClick();
        cleanup();
      }
    };

    document.addEventListener('keydown', onEsc);

    modal.appendChild(title);
    modal.appendChild(content);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  });
};

const showReminderPrompt = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    showReminderModal('Reminder', message, [
      { label: 'Cancel', onClick: () => resolve(false) },
      { label: 'Proceed', primary: true, onClick: () => resolve(true) }
    ]);
  });
};

type ReminderCompletionChoice = 'keep' | 'deactivate' | 'cancel';

const showReminderCompletionPrompt = (): Promise<ReminderCompletionChoice> => {
  return new Promise((resolve) => {
    showReminderModal(
      'Reminder',
      'Do you want to keep this reminder active or deactivate it?',
      [
        { label: 'Cancel', onClick: () => resolve('cancel') },
        { label: 'Keep reminder', onClick: () => resolve('keep') },
        { label: 'Deactivate', primary: true, onClick: () => resolve('deactivate') }
      ]
    );
  });
};

export const runReminderPreflightGate = async (method: string, requestPath: string | null): Promise<boolean> => {
  if (shouldSkipReminderCheck(requestPath)) {
    return true;
  }

  const token = localStorage.getItem('token');
  const preflightResponse = await reminderApi.get('/reminders/preflight', {
    params: {
      method,
      path: requestPath
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  const data = preflightResponse.data as { shouldShowReminder?: boolean; reminder?: { id: number; message: string } | null };
  if (data?.shouldShowReminder && data.reminder?.id) {
    const shouldProceed = await showReminderPrompt(data.reminder.message);
    if (!shouldProceed) {
      return false;
    }

    const completionChoice = await showReminderCompletionPrompt();
    if (completionChoice === 'cancel') {
      return false;
    }

    if (completionChoice === 'deactivate') {
      await reminderApi.patch(`/reminders/${data.reminder.id}/complete`, undefined, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      // Keep reminder indicators in sync across pages/components.
      window.dispatchEvent(new Event('reminders-updated'));
    }
  }

  return true;
};

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if ((config as any)._skipReminderCheck === true) {
      return config;
    }

    if ((config as any)._checkReminder === true) {
      const method = (config.method || 'GET').toUpperCase();
      const requestPath = buildRequestPath(config.url, config.baseURL);

      try {
        const shouldProceed = await runReminderPreflightGate(method, requestPath);
        if (!shouldProceed) {
          throw new axios.CanceledError('Request canceled by reminder popup');
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          throw error;
        }
        // Keep original behavior if reminder check fails.
        console.warn('Reminder preflight failed, continuing request:', error);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access - session expired
      const currentPath = window.location.pathname;
      
      // Only handle session expiration if not already on login page
      if (currentPath !== '/login' && currentPath !== '/register') {
        // Clear authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Dispatch custom event to notify AuthContext about session expiration
        // This allows React Router navigation to be handled properly
        window.dispatchEvent(new CustomEvent('session-expired', { 
          detail: { redirectTo: '/login?expired=true' } 
        }));
        
        // Fallback: Direct navigation if event doesn't work (e.g., during initial load)
        // Use setTimeout to allow React Router to handle it first
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login?expired=true';
          }
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

export default api; 
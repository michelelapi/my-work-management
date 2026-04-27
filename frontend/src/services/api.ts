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

const showReminderPrompt = (message: string): Promise<boolean> => {
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
    title.textContent = 'Reminder';
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

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.padding = '8px 14px';
    cancelButton.style.border = '1px solid #9ca3af';
    cancelButton.style.borderRadius = '6px';
    cancelButton.style.background = '#f3f4f6';
    cancelButton.style.cursor = 'pointer';

    const proceedButton = document.createElement('button');
    proceedButton.textContent = 'Proceed';
    proceedButton.style.padding = '8px 14px';
    proceedButton.style.border = 'none';
    proceedButton.style.borderRadius = '6px';
    proceedButton.style.background = '#2563eb';
    proceedButton.style.color = '#ffffff';
    proceedButton.style.cursor = 'pointer';

    const cleanup = (result: boolean) => {
      document.removeEventListener('keydown', onEsc);
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      resolve(result);
    };

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cleanup(false);
      }
    };

    cancelButton.onclick = () => cleanup(false);
    proceedButton.onclick = () => cleanup(true);
    overlay.onclick = (event) => {
      if (event.target === overlay) {
        cleanup(false);
      }
    };

    document.addEventListener('keydown', onEsc);

    actions.appendChild(cancelButton);
    actions.appendChild(proceedButton);
    modal.appendChild(title);
    modal.appendChild(content);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
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

    await reminderApi.patch(`/reminders/${data.reminder.id}/complete`, undefined, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });

    // Keep reminder indicators in sync across pages/components.
    window.dispatchEvent(new Event('reminders-updated'));
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
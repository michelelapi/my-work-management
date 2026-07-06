import axios from 'axios';
import config from '../config';
import { DbBackup } from '../types/dbBackup';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const responseError = error.response?.data?.error;
    if (typeof responseError === 'string' && responseError.trim()) {
      return responseError;
    }
  }
  return fallback;
};

const dbBackupService = {
  async listCompanyBackups(): Promise<DbBackup[]> {
    const response = await axios.get<DbBackup[]>(
      `${config.api.companyServiceUrl}/api/db-backups`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  async createCompanyBackup(): Promise<DbBackup> {
    try {
      const response = await axios.post<DbBackup>(
        `${config.api.companyServiceUrl}/api/db-backups`,
        {},
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Failed to create company database backup.'));
    }
  },

  async listAuthBackups(): Promise<DbBackup[]> {
    const response = await axios.get<DbBackup[]>(
      `${config.api.baseUrl}/api/db-backups`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  async createAuthBackup(): Promise<DbBackup> {
    try {
      const response = await axios.post<DbBackup>(
        `${config.api.baseUrl}/api/db-backups`,
        {},
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Failed to create authentication database backup.'));
    }
  },
};

export default dbBackupService;

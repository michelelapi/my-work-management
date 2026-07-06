import React, { useCallback, useEffect, useState } from 'react';
import dbBackupService from '../services/dbBackupService';
import { DbBackup } from '../types/dbBackup';

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

type BackupSectionProps = {
  title: string;
  description: string;
  backups: DbBackup[];
  creating: boolean;
  onCreateBackup: () => void;
};

const BackupSection: React.FC<BackupSectionProps> = ({
  title,
  description,
  backups,
  creating,
  onCreateBackup,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
      <div>
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
      </div>
      <button
        onClick={onCreateBackup}
        disabled={creating}
        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors whitespace-nowrap"
      >
        {creating ? 'Creating backup...' : 'Create Backup'}
      </button>
    </div>

    {backups.length === 0 ? (
      <div className="text-center text-gray-500 dark:text-gray-400 py-6">
        No backups yet.
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                File Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Database
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Size
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {backups.map((backup) => (
              <tr key={backup.fileName} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 text-sm font-mono">{backup.fileName}</td>
                <td className="px-4 py-3 text-sm">{backup.databaseName}</td>
                <td className="px-4 py-3 text-sm">{new Date(backup.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right">{formatFileSize(backup.sizeBytes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const DbBackupPage: React.FC = () => {
  const [companyBackups, setCompanyBackups] = useState<DbBackup[]>([]);
  const [authBackups, setAuthBackups] = useState<DbBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [creatingAuth, setCreatingAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadBackups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [company, auth] = await Promise.all([
        dbBackupService.listCompanyBackups(),
        dbBackupService.listAuthBackups(),
      ]);
      setCompanyBackups(company);
      setAuthBackups(auth);
    } catch (err) {
      console.error('Error loading database backups:', err);
      setError('Failed to load database backups.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  const handleCreateCompanyBackup = async () => {
    try {
      setCreatingCompany(true);
      setError(null);
      setSuccess(null);
      const created = await dbBackupService.createCompanyBackup();
      setCompanyBackups((prev) => [created, ...prev]);
      setSuccess(`Company database backup created: ${created.fileName}`);
    } catch (err) {
      console.error('Error creating company backup:', err);
      setError(err instanceof Error ? err.message : 'Failed to create company database backup.');
    } finally {
      setCreatingCompany(false);
    }
  };

  const handleCreateAuthBackup = async () => {
    try {
      setCreatingAuth(true);
      setError(null);
      setSuccess(null);
      const created = await dbBackupService.createAuthBackup();
      setAuthBackups((prev) => [created, ...prev]);
      setSuccess(`Authentication database backup created: ${created.fileName}`);
    } catch (err) {
      console.error('Error creating auth backup:', err);
      setError(err instanceof Error ? err.message : 'Failed to create authentication database backup.');
    } finally {
      setCreatingAuth(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading database backups...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Database Backups</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Create and review SQL dumps stored in each service&apos;s <code className="font-mono">db-backup</code> folder.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      <BackupSection
        title="Company Database"
        description="Backups for company_service_db (company-service)."
        backups={companyBackups}
        creating={creatingCompany}
        onCreateBackup={handleCreateCompanyBackup}
      />

      <BackupSection
        title="Authentication Database"
        description="Backups for auth_service_db (auth-service)."
        backups={authBackups}
        creating={creatingAuth}
        onCreateBackup={handleCreateAuthBackup}
      />
    </div>
  );
};

export default DbBackupPage;

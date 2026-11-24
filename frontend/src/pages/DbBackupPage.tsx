import React, { useCallback, useEffect, useState } from 'react';
import dbBackupService from '../services/dbBackupService';
import { BackupType, DbBackup } from '../types/dbBackup';

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatBackupType = (type?: BackupType): string => {
  if (type === 'INCREMENTAL') {
    return 'Incremental';
  }
  if (type === 'FULL') {
    return 'Full';
  }
  return '—';
};

type BackupSectionProps = {
  title: string;
  description: string;
  backups: DbBackup[];
  creatingIncremental: boolean;
  disabled: boolean;
  onCreateIncrementalBackup: () => void;
};

const BackupSection: React.FC<BackupSectionProps> = ({
  title,
  description,
  backups,
  creatingIncremental,
  disabled,
  onCreateIncrementalBackup,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
      <div>
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
      </div>
      <button
        onClick={onCreateIncrementalBackup}
        disabled={disabled}
        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors whitespace-nowrap"
      >
        {creatingIncremental ? 'Creating incremental backup...' : 'Create Incremental Backup'}
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
                Type
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Google Drive
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {backups.map((backup) => (
              <tr key={backup.fileName} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 text-sm font-mono">
                  <span className="mr-2">{backup.fileName}</span>
                  {backup.googleDriveWebViewLink && (
                    <a
                      href={backup.googleDriveWebViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sans text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Open
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">{formatBackupType(backup.backupType)}</td>
                <td className="px-4 py-3 text-sm">{backup.databaseName}</td>
                <td className="px-4 py-3 text-sm">{new Date(backup.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right">{formatFileSize(backup.sizeBytes)}</td>
                <td className="px-4 py-3 text-sm">
                  {backup.uploadedToGoogleDrive && backup.googleDriveWebViewLink ? (
                    <a
                      href={backup.googleDriveWebViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Open
                    </a>
                  ) : backup.uploadedToGoogleDrive ? (
                    'Uploaded'
                  ) : (
                    '—'
                  )}
                </td>
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
  const [creatingCompanyFull, setCreatingCompanyFull] = useState(false);
  const [creatingAuthFull, setCreatingAuthFull] = useState(false);
  const [creatingCompanyIncremental, setCreatingCompanyIncremental] = useState(false);
  const [creatingAuthIncremental, setCreatingAuthIncremental] = useState(false);
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

  const buildSuccessMessage = (label: string, created: DbBackup): string => {
    const typeLabel = created.backupType === 'FULL' ? 'full' : 'incremental';
    if (created.uploadedToGoogleDrive) {
      return `${label} ${typeLabel} backup created and copied to Google Drive: ${created.fileName}`;
    }
    return `${label} ${typeLabel} backup created locally: ${created.fileName} (Google Drive upload was skipped or failed — check server logs)`;
  };

  const handleCreateCompanyBackup = async (type: BackupType) => {
    const setCreating = type === 'FULL' ? setCreatingCompanyFull : setCreatingCompanyIncremental;
    try {
      setCreating(true);
      setError(null);
      setSuccess(null);
      const created = await dbBackupService.createCompanyBackup(type);
      setCompanyBackups((prev) => [created, ...prev]);
      setSuccess(buildSuccessMessage('Company', created));
    } catch (err) {
      console.error('Error creating company backup:', err);
      setError(err instanceof Error ? err.message : 'Failed to create company database backup.');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateAuthBackup = async (type: BackupType) => {
    const setCreating = type === 'FULL' ? setCreatingAuthFull : setCreatingAuthIncremental;
    try {
      setCreating(true);
      setError(null);
      setSuccess(null);
      const created = await dbBackupService.createAuthBackup(type);
      setAuthBackups((prev) => [created, ...prev]);
      setSuccess(buildSuccessMessage('Authentication', created));
    } catch (err) {
      console.error('Error creating auth backup:', err);
      setError(err instanceof Error ? err.message : 'Failed to create authentication database backup.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading database backups...</div>;
  }

  const anyCreating =
    creatingCompanyFull || creatingAuthFull || creatingCompanyIncremental || creatingAuthIncremental;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Database Backups</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Use <strong>entire</strong> backups for a full DB snapshot, and <strong>incremental</strong> backups for
            tables changed since the last backup. Files are stored in each service&apos;s{' '}
            <code className="font-mono">db-backup</code> folder and copied to Google Drive.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <button
            onClick={() => handleCreateCompanyBackup('FULL')}
            disabled={anyCreating}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors whitespace-nowrap"
          >
            {creatingCompanyFull ? 'Backing up Company DB...' : 'Backup Entire Company DB'}
          </button>
          <button
            onClick={() => handleCreateAuthBackup('FULL')}
            disabled={anyCreating}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors whitespace-nowrap"
          >
            {creatingAuthFull ? 'Backing up Auth DB...' : 'Backup Entire Auth DB'}
          </button>
        </div>
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
        description="Incremental backups dump only tables changed since the last backup baseline."
        backups={companyBackups}
        creatingIncremental={creatingCompanyIncremental}
        disabled={anyCreating}
        onCreateIncrementalBackup={() => handleCreateCompanyBackup('INCREMENTAL')}
      />

      <BackupSection
        title="Authentication Database"
        description="Incremental backups dump only tables changed since the last backup baseline."
        backups={authBackups}
        creatingIncremental={creatingAuthIncremental}
        disabled={anyCreating}
        onCreateIncrementalBackup={() => handleCreateAuthBackup('INCREMENTAL')}
      />
    </div>
  );
};

export default DbBackupPage;

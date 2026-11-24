export type BackupType = 'FULL' | 'INCREMENTAL';

export interface DbBackup {
  fileName: string;
  databaseName: string;
  sizeBytes: number;
  createdAt: string;
  backupType?: BackupType;
  uploadedToGoogleDrive?: boolean;
  googleDriveFileId?: string | null;
  googleDriveWebViewLink?: string | null;
}

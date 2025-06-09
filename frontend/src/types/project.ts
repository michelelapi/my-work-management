export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
  CANCELLED = 'CANCELLED',
}

export interface Project {
  id?: number;
  companyId: number;
  name: string;
  description?: string;
  dailyRate?: number;
  hourlyRate?: number;
  currency?: string;
  startDate?: string; // LocalDate as string
  endDate?: string;   // LocalDate as string
  estimatedHours?: number;
  status: ProjectStatus;
  createdAt?: string; // LocalDateTime as string
  updatedAt?: string; // LocalDateTime as string
  companyName?: string; // Add this field to display company name
} 
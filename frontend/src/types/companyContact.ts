export interface CompanyContact {
  id?: number;
  companyId?: number;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  isPrimary: boolean;
  createdAt?: Date;
} 
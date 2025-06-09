export interface Company {
  id?: number;
  name: string;
  description?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  taxId?: string;
  paymentTerms?: number;
  status?: string; // Assuming CompanyStatus enum is represented as a string
  createdAt?: string; // Assuming LocalDateTime is represented as a string
  updatedAt?: string; // Assuming LocalDateTime is represented as a string
}

export interface CompanyContact {
  id?: number;
  companyId: number; // Link to the Company
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  isPrimary?: boolean;
  createdAt?: string; // Assuming LocalDateTime is represented as a string
} 
export interface Client {
  id?: number;
  projectId: number;
  name: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  projectManagerName?: string;
  createdAt?: string;
  updatedAt?: string;
  userEmail?: string;
}

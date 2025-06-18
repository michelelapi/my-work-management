import api from './api';

export interface CompanyProjectStats {
    companyId: number;
    companyName: string;
    projectCount: number;
    taskCount: number;
    totalHours: number;
    totalAmount: number;
    totalToBeBilledAmount: number;
    totalToBePaidAmount: number;
    currency: string;
}

export interface ProjectCost {
    projectName: string;
    month: string;
    totalCost: number;
}

export const statisticsService = {
    async getCompanyProjectStats(): Promise<CompanyProjectStats[]> {
        const response = await api.get<CompanyProjectStats[]>('/statistics/company-project-stats');
        return response.data;
    },

    async getProjectCosts(): Promise<ProjectCost[]> {
        const response = await api.get<ProjectCost[]>('/projects/costs');
        return response.data;
    }
}; 
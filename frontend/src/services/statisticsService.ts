import api from './api';

export interface CompanyProjectStats {
    companyId: number;
    companyName: string;
    projectCount: number;
    taskCount: number;
    totalHours: number;
    totalAmount: number;
}

export const statisticsService = {
    async getCompanyProjectStats(): Promise<CompanyProjectStats[]> {
        const response = await api.get<CompanyProjectStats[]>('/statistics/company-project-stats');
        return response.data;
    }
}; 
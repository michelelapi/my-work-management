import { Contract } from '../types/contract';
import api from './api';

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

const contractService = {
    async getAllContracts(page: number = 0, size: number = 100): Promise<PageResponse<Contract>> {
        const response = await api.get<PageResponse<Contract>>('/contracts', {
            params: { page, size }
        });
        return response.data;
    },

    async getContractById(contractId: number): Promise<Contract> {
        const response = await api.get<Contract>(`/contracts/${contractId}`);
        return response.data;
    },

    async getContractsByCompany(companyId: number): Promise<Contract[]> {
        const response = await api.get<Contract[]>(`/companies/${companyId}/contracts`);
        return response.data;
    },

    async getContractsByProject(projectId: number): Promise<Contract[]> {
        const response = await api.get<Contract[]>(`/projects/${projectId}/contracts`);
        return response.data;
    },

    async createContract(companyId: number, contract: Contract): Promise<Contract> {
        const response = await api.post<Contract>(`/companies/${companyId}/contracts`, contract);
        return response.data;
    },

    async updateContract(companyId: number, contractId: number, contract: Contract): Promise<Contract> {
        const response = await api.put<Contract>(`/companies/${companyId}/contracts/${contractId}`, contract);
        return response.data;
    },

    async deleteContract(companyId: number, contractId: number): Promise<void> {
        await api.delete(`/companies/${companyId}/contracts/${contractId}`);
    },
};

export default contractService;

export interface ContractUsage {
    contractId: number;
    contractCode: string;
    amountUsed: number;
}

export interface Contract {
    id?: number;
    companyId: number;
    companyName?: string;
    name: string;
    code: string;
    totalAmount: number;
    amountAvailable: number;
    startDate?: string;
    endDate?: string;
    notes?: string;
    status: 'OPEN' | 'COMPLETED';
    projectIds?: number[];
    userEmail?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ContractUsage {
    id?: number;
    contractId: number;
    contractCode: string;
    amountUsed: number;
    invoiceId?: string;
    billingDate?: string;
    paymentDate?: string;
    isBilled?: boolean;
    isPaid?: boolean;
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

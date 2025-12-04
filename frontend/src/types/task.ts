export interface Task {
    id?: number;
    projectId?: number;
    projectName?: string;
    title: string;
    description?: string;
    ticketId?: string;
    startDate: string;
    endDate?: string;
    hoursWorked: number;
    rateUsed?: number;
    type?: string;
    currency?: string;
    isBilled?: boolean;
    isPaid?: boolean;
    billingDate?: string;
    paymentDate?: string;
    invoiceId?: string;
    referencedTaskId?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
    companyName?: string;
    userEmail?: string;
} 
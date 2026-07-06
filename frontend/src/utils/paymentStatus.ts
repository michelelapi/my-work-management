import { Task } from '../types/task';
import { ContractUsage } from '../types/contract';

export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid';

export const getPaymentStatus = (task: Task): PaymentStatus => {
    if (task.isPaid) return 'paid';
    if (task.isPartiallyPaid) return 'partially_paid';
    return 'unpaid';
};

export const getNextUnpaidUsage = (task: Task): ContractUsage | undefined => {
    return task.contractUsages?.find(
        usage =>
            (usage.isBilled || (usage.invoiceId && usage.invoiceId.trim() !== '')) &&
            !usage.isPaid &&
            !usage.paymentDate
    );
};

export const formatPaymentAmount = (amount: number): string => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

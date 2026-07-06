import { Task } from '../types/task';
import { ContractUsage } from '../types/contract';

export type BillingStatus = 'unbilled' | 'partially_billed' | 'billed';

export const getBillingStatus = (task: Task): BillingStatus => {
    if (task.isBilled) return 'billed';
    if (task.isPartiallyBilled) return 'partially_billed';
    return 'unbilled';
};

export const getNextUnbilledUsage = (task: Task): ContractUsage | undefined => {
    return task.contractUsages?.find(
        usage => !usage.isBilled && (!usage.invoiceId || usage.invoiceId.trim() === '')
    );
};

export const formatBillingAmount = (amount: number): string => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

import React, { useEffect, useState } from 'react';
import { FaCheck } from '@react-icons/all-files/fa/FaCheck';
import { Task } from '../types/task';
import { formatBillingAmount, getNextUnbilledUsage } from '../utils/billingStatus';

interface PartialBillingModalProps {
    isOpen: boolean;
    task: Task | null;
    updating?: boolean;
    onClose: () => void;
    onUpdate: (taskId: number, invoiceId: string, billingDate: string) => void;
}

const PartialBillingModal: React.FC<PartialBillingModalProps> = ({
    isOpen,
    task,
    updating = false,
    onClose,
    onUpdate
}) => {
    const [invoiceId, setInvoiceId] = useState('');
    const [billingDate, setBillingDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (isOpen) {
            setInvoiceId('');
            setBillingDate(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen, task?.id]);

    if (!isOpen || !task) return null;

    const nextUsage = getNextUnbilledUsage(task);
    const billedUsages = task.contractUsages?.filter(usage => usage.isBilled || usage.invoiceId) ?? [];

    const handleUpdate = () => {
        if (!task.id || !invoiceId.trim() || !nextUsage) return;
        onUpdate(task.id, invoiceId.trim(), billingDate);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative p-5 border w-full max-w-lg shadow-lg rounded-md bg-white dark:bg-gray-800">
                <div className="flex items-center justify-center mb-2">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900">
                        <FaCheck className="h-6 w-6 text-orange-600 dark:text-orange-200" />
                    </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center">
                    Bill Remaining Portion
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1 mb-4 px-2">
                    {task.title}
                    {task.ticketId ? ` (${task.ticketId})` : ''}
                </p>

                {nextUsage ? (
                    <div className="mb-4 rounded-md border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-4">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                            Next portion to bill
                        </p>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            <div><span className="font-medium">Contract:</span> {nextUsage.contractCode}</div>
                            <div><span className="font-medium">Amount:</span> {formatBillingAmount(nextUsage.amountUsed)}</div>
                        </div>
                    </div>
                ) : (
                    <p className="mb-4 text-sm text-red-600 dark:text-red-400 text-center">
                        No remaining contract portion found for this task.
                    </p>
                )}

                {billedUsages.length > 0 && (
                    <div className="mb-4 rounded-md border border-gray-200 dark:border-gray-600 p-3">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                            Already billed
                        </p>
                        <div className="space-y-1">
                            {billedUsages.map((usage, index) => (
                                <div key={usage.id ?? index} className="text-xs text-gray-600 dark:text-gray-300">
                                    <span className="font-mono">{usage.contractCode}</span>
                                    {' · '}
                                    {formatBillingAmount(usage.amountUsed)}
                                    {usage.invoiceId ? ` · Invoice ${usage.invoiceId}` : ''}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-4 mb-4">
                    <div className="flex flex-col space-y-1">
                        <label htmlFor="partialInvoiceId" className="text-sm text-gray-600 dark:text-gray-400">
                            Invoice ID
                        </label>
                        <input
                            type="text"
                            id="partialInvoiceId"
                            value={invoiceId}
                            onChange={(e) => setInvoiceId(e.target.value)}
                            placeholder="Enter invoice ID for this portion"
                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full"
                        />
                    </div>
                    <div className="flex flex-col space-y-1">
                        <label htmlFor="partialBillingDate" className="text-sm text-gray-600 dark:text-gray-400">
                            Billing Date
                        </label>
                        <input
                            type="date"
                            id="partialBillingDate"
                            value={billingDate}
                            onChange={(e) => setBillingDate(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                </div>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={onClose}
                        disabled={updating}
                        className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpdate}
                        disabled={updating || !invoiceId.trim() || !nextUsage}
                        className="px-4 py-2 bg-orange-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 flex items-center gap-2"
                    >
                        {updating ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                Updating...
                            </>
                        ) : (
                            'Bill Portion'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PartialBillingModal;

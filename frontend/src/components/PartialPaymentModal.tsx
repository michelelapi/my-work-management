import React, { useEffect, useState } from 'react';
import { FaCheck } from '@react-icons/all-files/fa/FaCheck';
import { Task } from '../types/task';
import { formatPaymentAmount, getNextUnpaidUsage } from '../utils/paymentStatus';

interface PartialPaymentModalProps {
    isOpen: boolean;
    task: Task | null;
    updating?: boolean;
    onClose: () => void;
    onUpdate: (taskId: number, paymentDate: string) => void;
}

const PartialPaymentModal: React.FC<PartialPaymentModalProps> = ({
    isOpen,
    task,
    updating = false,
    onClose,
    onUpdate
}) => {
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (isOpen) {
            setPaymentDate(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen, task?.id]);

    if (!isOpen || !task) return null;

    const nextUsage = getNextUnpaidUsage(task);
    const paidUsages = task.contractUsages?.filter(usage => usage.isPaid || usage.paymentDate) ?? [];

    const handleUpdate = () => {
        if (!task.id || !nextUsage) return;
        onUpdate(task.id, paymentDate);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative p-5 border w-full max-w-lg shadow-lg rounded-md bg-white dark:bg-gray-800">
                <div className="flex items-center justify-center mb-2">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-sky-100 dark:bg-sky-900">
                        <FaCheck className="h-6 w-6 text-sky-600 dark:text-sky-200" />
                    </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center">
                    Pay Remaining Portion
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1 mb-4 px-2">
                    {task.title}
                    {task.ticketId ? ` (${task.ticketId})` : ''}
                </p>

                {nextUsage ? (
                    <div className="mb-4 rounded-md border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 p-4">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                            Next portion to pay
                        </p>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            <div><span className="font-medium">Contract:</span> {nextUsage.contractCode}</div>
                            <div><span className="font-medium">Amount:</span> {formatPaymentAmount(nextUsage.amountUsed)}</div>
                            {nextUsage.invoiceId && (
                                <div><span className="font-medium">Invoice:</span> {nextUsage.invoiceId}</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="mb-4 text-sm text-red-600 dark:text-red-400 text-center">
                        No remaining billed portion found for this task.
                    </p>
                )}

                {paidUsages.length > 0 && (
                    <div className="mb-4 rounded-md border border-gray-200 dark:border-gray-600 p-3">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                            Already paid
                        </p>
                        <div className="space-y-1">
                            {paidUsages.map((usage, index) => (
                                <div key={usage.id ?? index} className="text-xs text-gray-600 dark:text-gray-300">
                                    <span className="font-mono">{usage.contractCode}</span>
                                    {' · '}
                                    {formatPaymentAmount(usage.amountUsed)}
                                    {usage.paymentDate ? ` · ${usage.paymentDate.split('T')[0]}` : ''}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mb-4">
                    <label htmlFor="partialPaymentDate" className="text-sm text-gray-600 dark:text-gray-400">
                        Payment Date
                    </label>
                    <input
                        type="date"
                        id="partialPaymentDate"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full"
                    />
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
                        disabled={updating || !nextUsage}
                        className="px-4 py-2 bg-sky-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 flex items-center gap-2"
                    >
                        {updating ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                Updating...
                            </>
                        ) : (
                            'Pay Portion'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PartialPaymentModal;

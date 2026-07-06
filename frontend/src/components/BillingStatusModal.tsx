import React, { useCallback, useState } from 'react';
import { FaCheck } from '@react-icons/all-files/fa/FaCheck';
import { Task } from '../types/task';
import SortableTaskList from './SortableTaskList';

interface BillingStatusModalProps {
    isOpen: boolean;
    tasks: Task[];
    selectedBillingStatus: boolean | null;
    onBillingStatusChange: (status: boolean | null) => void;
    billingDate: string;
    onBillingDateChange: (date: string) => void;
    invoiceId: string;
    onInvoiceIdChange: (id: string) => void;
    updating?: boolean;
    onClose: () => void;
    onUpdate: (orderedTasks: Task[]) => void;
}

const BillingStatusModal: React.FC<BillingStatusModalProps> = ({
    isOpen,
    tasks,
    selectedBillingStatus,
    onBillingStatusChange,
    billingDate,
    onBillingDateChange,
    invoiceId,
    onInvoiceIdChange,
    updating = false,
    onClose,
    onUpdate
}) => {
    const [orderedTasks, setOrderedTasks] = useState<Task[]>([]);

    const handleOrderedTasksChange = useCallback((next: Task[]) => {
        setOrderedTasks(next);
    }, []);

    if (!isOpen) return null;

    const handleUpdate = () => {
        if (selectedBillingStatus === null || orderedTasks.length === 0) return;
        onUpdate(orderedTasks);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-center mb-2">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                        <FaCheck className="h-6 w-6 text-green-600 dark:text-green-200" />
                    </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center">
                    Update Billing Status
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1 mb-2 px-2">
                    {tasks.length} task{tasks.length !== 1 ? 's' : ''} will be updated. Drag to reorder if needed.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4 px-2">
                    For tasks split across multiple contracts, use comma-separated invoice IDs (e.g. INV-001, INV-002) to bill all portions at once. A single invoice ID bills only the first portion and marks the task as partially billed.
                </p>

                <div className="mb-4 min-h-0 flex-1 flex flex-col max-h-64">
                    <SortableTaskList
                        tasks={tasks}
                        isActive={isOpen}
                        accent="green"
                        onOrderedTasksChange={handleOrderedTasksChange}
                    />
                </div>

                <div className="px-2 space-y-4 mb-4">
                    <div className="flex justify-center gap-4">
                        <button
                            type="button"
                            onClick={() => onBillingStatusChange(true)}
                            className={`px-4 py-2 rounded-md text-sm ${
                                selectedBillingStatus === true
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                        >
                            Mark as Billed
                        </button>
                        <button
                            type="button"
                            onClick={() => onBillingStatusChange(false)}
                            className={`px-4 py-2 rounded-md text-sm ${
                                selectedBillingStatus === false
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                        >
                            Mark as Unbilled
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-1">
                            <label htmlFor="billingDate" className="text-sm text-gray-600 dark:text-gray-400">
                                Billing Date
                            </label>
                            <input
                                type="date"
                                id="billingDate"
                                value={billingDate}
                                onChange={(e) => onBillingDateChange(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div className="flex flex-col space-y-1">
                            <label htmlFor="invoiceId" className="text-sm text-gray-600 dark:text-gray-400">
                                Invoice ID
                            </label>
                            <input
                                type="text"
                                id="invoiceId"
                                value={invoiceId}
                                onChange={(e) => onInvoiceIdChange(e.target.value)}
                                placeholder="Enter invoice ID"
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-center gap-4 pt-2">
                    <button
                        onClick={onClose}
                        disabled={updating}
                        className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpdate}
                        disabled={updating || selectedBillingStatus === null || orderedTasks.length === 0}
                        className="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center gap-2"
                    >
                        {updating ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                Updating...
                            </>
                        ) : (
                            'Update'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BillingStatusModal;

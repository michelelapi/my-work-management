import React from 'react';
import { Task } from '../types/task';

// Helper function to format numbers with thousands separators
const formatNumber = (value: number, decimals: number = 2): string => {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

interface InfoForBillModalProps {
    isOpen: boolean;
    tasksByDay: Record<string, Task[]>;
    totalHours: number;
    taskIdsString: string;
    totalAmount: number;
    copiedField: string | null;
    onCopy: (value: string, field: string) => void;
    onClose: () => void;
}

const InfoForBillModal: React.FC<InfoForBillModalProps> = ({
    isOpen,
    tasksByDay,
    totalHours,
    taskIdsString,
    totalAmount,
    copiedField,
    onCopy,
    onClose
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
                <div className="mt-3">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-2 mb-4 text-center">
                        Info For Bill
                    </h3>
                    
                    {/* Tasks grouped by day */}
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tasks by Day (for Interlem Timesheet)</h4>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {Object.entries(tasksByDay).map(([date, dayTasks]) => (
                                <div key={date} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                                    <div className="font-medium text-sm text-gray-800 dark:text-gray-200 mb-1">{date}</div>
                                    {dayTasks.map((task, idx) => (
                                        <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 ml-4">
                                            • {task.title || task.description || 'No title'} - {task.hoursWorked}h {task.ticketId ? `(${task.ticketId})` : ''}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col items-start space-y-4">
                        <div className="w-full">
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Total Hours</label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={formatNumber(totalHours)}
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs"
                                />
                                <button
                                    onClick={() => onCopy(formatNumber(totalHours), 'hours')}
                                    className="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 text-xs"
                                >
                                    {copiedField === 'hours' ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                        <div className="w-full">
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Task IDs</label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={taskIdsString}
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs"
                                />
                                <button
                                    onClick={() => onCopy(taskIdsString, 'ids')}
                                    className="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 text-xs"
                                >
                                    {copiedField === 'ids' ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                        <div className="w-full">
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount</label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={formatNumber(totalAmount)}
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs"
                                />
                                <button
                                    onClick={() => onCopy(formatNumber(totalAmount), 'amount')}
                                    className="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 text-xs"
                                >
                                    {copiedField === 'amount' ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center space-x-4 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfoForBillModal;

import React from 'react';
import { FaCheck } from "@react-icons/all-files/fa/FaCheck";

interface BillingStatusModalProps {
    isOpen: boolean;
    taskCount: number;
    selectedBillingStatus: boolean | null;
    onBillingStatusChange: (status: boolean | null) => void;
    billingDate: string;
    onBillingDateChange: (date: string) => void;
    invoiceId: string;
    onInvoiceIdChange: (id: string) => void;
    onClose: () => void;
    onUpdate: () => void;
}

const BillingStatusModal: React.FC<BillingStatusModalProps> = ({
    isOpen,
    taskCount,
    selectedBillingStatus,
    onBillingStatusChange,
    billingDate,
    onBillingDateChange,
    invoiceId,
    onInvoiceIdChange,
    onClose,
    onUpdate
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
            <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
                <div className="mt-3 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                        <FaCheck className="h-6 w-6 text-green-600 dark:text-green-200" />
                    </div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-2">
                        Update Billing Status
                    </h3>
                    <div className="mt-2 px-7 py-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            This will update the billing status for all {taskCount} filtered tasks.
                        </p>
                        <div className="flex flex-col space-y-4">
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={() => onBillingStatusChange(true)}
                                    className={`px-4 py-2 rounded-md ${
                                        selectedBillingStatus === true
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                    }`}
                                >
                                    Mark as Billed
                                </button>
                                <button
                                    onClick={() => onBillingStatusChange(false)}
                                    className={`px-4 py-2 rounded-md ${
                                        selectedBillingStatus === false
                                            ? 'bg-yellow-500 text-white'
                                            : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                    }`}
                                >
                                    Mark as Unbilled
                                </button>
                            </div>
                            <div className="flex flex-col items-center space-y-2">
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
                            <div className="flex flex-col items-center space-y-2">
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
                    <div className="flex justify-center space-x-4 mt-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onUpdate}
                            disabled={selectedBillingStatus === null}
                            className="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                        >
                            Update
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillingStatusModal;

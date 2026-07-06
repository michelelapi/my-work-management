import React from 'react';
import { FaCheck } from '@react-icons/all-files/fa/FaCheck';

interface PaymentStatusModalProps {
    isOpen: boolean;
    taskCount: number;
    selectedPaymentStatus: boolean | null;
    onPaymentStatusChange: (status: boolean | null) => void;
    paymentDate: string;
    onPaymentDateChange: (date: string) => void;
    paymentDates: string;
    onPaymentDatesChange: (dates: string) => void;
    updating?: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

const PaymentStatusModal: React.FC<PaymentStatusModalProps> = ({
    isOpen,
    taskCount,
    selectedPaymentStatus,
    onPaymentStatusChange,
    paymentDate,
    onPaymentDateChange,
    paymentDates,
    onPaymentDatesChange,
    updating = false,
    onClose,
    onUpdate
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
                <div className="flex items-center justify-center mb-2">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900">
                        <FaCheck className="h-6 w-6 text-blue-600 dark:text-blue-200" />
                    </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center">
                    Update Payment Status
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2 mb-4 px-2">
                    This will update the payment status for {taskCount} task{taskCount !== 1 ? 's' : ''}.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4 px-2">
                    For tasks split across multiple billed contracts, use comma-separated payment dates (e.g. 2025-01-15, 2025-02-20) to pay all billed portions at once. A single payment date pays only the first billed portion. Partially billed tasks will become partially paid, not fully paid.
                </p>

                <div className="px-2 space-y-4 mb-4">
                    <div className="flex justify-center gap-4">
                        <button
                            type="button"
                            onClick={() => onPaymentStatusChange(true)}
                            className={`px-4 py-2 rounded-md text-sm ${
                                selectedPaymentStatus === true
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                        >
                            Mark as Paid
                        </button>
                        <button
                            type="button"
                            onClick={() => onPaymentStatusChange(false)}
                            className={`px-4 py-2 rounded-md text-sm ${
                                selectedPaymentStatus === false
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                        >
                            Mark as Unpaid
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col space-y-1">
                            <label htmlFor="paymentDate" className="text-sm text-gray-600 dark:text-gray-400">
                                Payment Date
                            </label>
                            <input
                                type="date"
                                id="paymentDate"
                                value={paymentDate}
                                onChange={(e) => onPaymentDateChange(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div className="flex flex-col space-y-1">
                            <label htmlFor="paymentDates" className="text-sm text-gray-600 dark:text-gray-400">
                                Payment Dates (optional)
                            </label>
                            <input
                                type="text"
                                id="paymentDates"
                                value={paymentDates}
                                onChange={(e) => onPaymentDatesChange(e.target.value)}
                                placeholder="2025-01-15, 2025-02-20"
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full"
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
                        onClick={onUpdate}
                        disabled={updating || selectedPaymentStatus === null}
                        className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2"
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

export default PaymentStatusModal;

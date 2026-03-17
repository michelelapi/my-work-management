import React from 'react';
import { FaCheck } from "@react-icons/all-files/fa/FaCheck";

interface PaymentStatusModalProps {
    isOpen: boolean;
    taskCount: number;
    selectedPaymentStatus: boolean | null;
    onPaymentStatusChange: (status: boolean | null) => void;
    paymentDate: string;
    onPaymentDateChange: (date: string) => void;
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
    onClose,
    onUpdate
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
            <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
                <div className="mt-3 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900">
                        <FaCheck className="h-6 w-6 text-blue-600 dark:text-blue-200" />
                    </div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-2">
                        Update Payment Status
                    </h3>
                    <div className="mt-2 px-7 py-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            This will update the payment status for all {taskCount} filtered tasks.
                        </p>
                        <div className="flex flex-col space-y-4">
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={() => onPaymentStatusChange(true)}
                                    className={`px-4 py-2 rounded-md ${
                                        selectedPaymentStatus === true
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                    }`}
                                >
                                    Mark as Paid
                                </button>
                                <button
                                    onClick={() => onPaymentStatusChange(false)}
                                    className={`px-4 py-2 rounded-md ${
                                        selectedPaymentStatus === false
                                            ? 'bg-yellow-500 text-white'
                                            : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                    }`}
                                >
                                    Mark as Unpaid
                                </button>
                            </div>
                            <div className="flex flex-col items-center space-y-2">
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
                            disabled={selectedPaymentStatus === null}
                            className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            Update
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentStatusModal;

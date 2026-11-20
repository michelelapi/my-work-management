import React from 'react';

export interface BillInfoRow {
    invoiceId: string;
    billingDate?: string;
    paymentDate?: string;
}

interface BillsInfoModalProps {
    isOpen: boolean;
    projectName?: string;
    bills: BillInfoRow[];
    loading?: boolean;
    onClose: () => void;
}

const formatDate = (value?: string): string => {
    if (!value) return '—';
    return value.split('T')[0];
};

const BillsInfoModal: React.FC<BillsInfoModalProps> = ({
    isOpen,
    projectName,
    bills,
    loading = false,
    onClose
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
                <div className="mt-3">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-2 mb-1 text-center">
                        Bills Info
                    </h3>
                    {projectName && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                            Project: {projectName}
                        </p>
                    )}

                    {loading ? (
                        <div className="py-8 text-center text-sm text-gray-600 dark:text-gray-400">
                            Loading bills…
                        </div>
                    ) : bills.length === 0 ? (
                        <div className="py-8 text-center text-sm text-gray-600 dark:text-gray-400">
                            No invoices found for this project.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Invoice ID
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Billing Date
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Payment Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {bills.map((bill) => (
                                        <tr key={bill.invoiceId}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {bill.invoiceId}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                                {formatDate(bill.billingDate)}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                                {formatDate(bill.paymentDate)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

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

export default BillsInfoModal;

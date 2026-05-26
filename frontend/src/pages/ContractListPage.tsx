import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Contract } from '../types/contract';
import contractService from '../services/contractService';
import { FaPen } from "@react-icons/all-files/fa/FaPen";
import { FaTrash } from "@react-icons/all-files/fa/FaTrash";

const formatNumber = (value: number, decimals: number = 2): string => {
    return value.toLocaleString('it-IT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const ContractListPage: React.FC = () => {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await contractService.getAllContracts();
            setContracts(response.content);
        } catch (err) {
            console.error('Error fetching contracts:', err);
            setError('Failed to load contracts');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteContract = async () => {
        if (!contractToDelete?.id || !contractToDelete?.companyId) return;
        try {
            await contractService.deleteContract(contractToDelete.companyId, contractToDelete.id);
            setContracts(prev => prev.filter(c => c.id !== contractToDelete.id));
            setDeleteModalOpen(false);
            setContractToDelete(null);
        } catch (err) {
            console.error('Error deleting contract:', err);
            setError('Failed to delete contract');
        }
    };

    const filteredContracts = contracts.filter(c => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            c.name.toLowerCase().includes(term) ||
            c.code.toLowerCase().includes(term) ||
            (c.companyName && c.companyName.toLowerCase().includes(term))
        );
    });

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen">Loading contracts...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center min-h-screen">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            {deleteModalOpen && contractToDelete && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                                <svg className="h-6 w-6 text-red-600 dark:text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-2">Delete Contract</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Are you sure you want to delete the contract "{contractToDelete.name}" ({contractToDelete.code})? This action cannot be undone.
                                </p>
                            </div>
                            <div className="flex justify-center space-x-4 mt-4">
                                <button
                                    onClick={() => { setDeleteModalOpen(false); setContractToDelete(null); }}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteContract}
                                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <input
                    type="text"
                    placeholder="Search by name, code or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
                <Link
                    to="/contracts/new"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-md transition-colors font-medium shadow-md hover:shadow-lg"
                >
                    Create New Contract
                </Link>
            </div>

            {filteredContracts.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
                    No contracts found.
                </div>
            ) : (
                <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Code</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Available</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Period</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredContracts.map((contract) => {
                                const usedPercent = contract.totalAmount > 0
                                    ? ((contract.totalAmount - contract.amountAvailable) / contract.totalAmount) * 100
                                    : 0;
                                return (
                                    <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm font-mono font-medium text-gray-900 dark:text-white">{contract.code}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">{contract.name}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm text-gray-500 dark:text-gray-300">{contract.companyName || '-'}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <div className="text-sm text-gray-900 dark:text-white">{formatNumber(contract.totalAmount)}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{formatNumber(contract.amountAvailable)}</div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-1">
                                                <div
                                                    className={`h-1.5 rounded-full ${usedPercent > 90 ? 'bg-red-500' : usedPercent > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                    style={{ width: `${Math.min(usedPercent, 100)}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                contract.status === 'OPEN'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                                            }`}>
                                                {contract.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm text-gray-500 dark:text-gray-300">
                                                {contract.startDate || '-'} / {contract.endDate || '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                to={`/companies/${contract.companyId}/contracts/${contract.id}/edit`}
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                                                title="Edit"
                                            >
                                                <FaPen size={14} className="inline-block" />
                                            </Link>
                                            <button
                                                onClick={() => { setContractToDelete(contract); setDeleteModalOpen(true); }}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                title="Delete"
                                            >
                                                <FaTrash size={14} className="inline-block" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ContractListPage;

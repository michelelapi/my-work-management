import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Contract } from '../types/contract';
import { Company } from '../types/company';
import contractService from '../services/contractService';
import companyService from '../services/companyService';

interface ValidationErrors {
    companyId?: string;
    name?: string;
    code?: string;
    totalAmount?: string;
    amountAvailable?: string;
    startDate?: string;
    endDate?: string;
}

const ContractFormPage: React.FC = () => {
    const { companyId, contractId } = useParams<{ companyId: string; contractId: string }>();
    const navigate = useNavigate();
    const [contract, setContract] = useState<Contract>({
        companyId: companyId ? parseInt(companyId, 10) : 0,
        name: '',
        code: '',
        totalAmount: 0,
        amountAvailable: 0,
        status: 'OPEN',
    });
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const isEditMode = !!contractId;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const fetchedCompanies = await companyService.getAllCompanies();
                setCompanies(fetchedCompanies);

                if (isEditMode && contractId) {
                    const fetched = await contractService.getContractById(parseInt(contractId, 10));
                    setContract(fetched);
                } else if (companyId) {
                    setContract(prev => ({ ...prev, companyId: parseInt(companyId, 10) }));
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load form data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [isEditMode, companyId, contractId]);

    const validateForm = (): boolean => {
        const errors: ValidationErrors = {};
        let isValid = true;

        if (!contract.companyId || contract.companyId === 0) {
            errors.companyId = 'Company is required';
            isValid = false;
        }
        if (!contract.name || contract.name.trim().length < 2) {
            errors.name = 'Name must be at least 2 characters';
            isValid = false;
        }
        if (!contract.code || contract.code.trim().length < 2) {
            errors.code = 'Code is required';
            isValid = false;
        }
        if (contract.totalAmount === undefined || contract.totalAmount < 0) {
            errors.totalAmount = 'Total amount must be >= 0';
            isValid = false;
        }
        if (contract.amountAvailable === undefined || contract.amountAvailable < 0) {
            errors.amountAvailable = 'Amount available must be >= 0';
            isValid = false;
        }
        if (contract.amountAvailable !== undefined && contract.totalAmount !== undefined && contract.amountAvailable > contract.totalAmount) {
            errors.amountAvailable = 'Amount available cannot exceed total amount';
            isValid = false;
        }
        if (contract.startDate && contract.endDate) {
            if (new Date(contract.startDate) > new Date(contract.endDate)) {
                errors.endDate = 'End date cannot be before start date';
                isValid = false;
            }
        }

        setValidationErrors(errors);
        return isValid;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setContract(prev => ({
            ...prev,
            [name]: name === 'companyId' || name === 'totalAmount' || name === 'amountAvailable'
                ? (value ? Number(value) : 0)
                : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setShowConfirmModal(true);
    };

    const handleConfirmSave = async () => {
        setSaveError(null);
        setIsSaving(true);
        try {
            if (isEditMode && contractId) {
                await contractService.updateContract(contract.companyId, parseInt(contractId, 10), contract);
            } else {
                await contractService.createContract(contract.companyId, contract);
            }
            navigate('/contracts');
        } catch (err: any) {
            console.error('Error saving contract:', err);
            const message = err?.response?.data?.message || err?.message || 'Unknown error';
            setSaveError(`Failed to save contract: ${message}`);
        } finally {
            setIsSaving(false);
            setShowConfirmModal(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen">Loading form...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center min-h-screen">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            {showConfirmModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                                <svg className="h-6 w-6 text-green-600 dark:text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-2">
                                {isEditMode ? 'Update Contract' : 'Create Contract'}
                            </h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Are you sure you want to {isEditMode ? 'update' : 'create'} this contract?
                                </p>
                            </div>
                            <div className="flex justify-center space-x-4 mt-4">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmSave}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-700 disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {saveError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{saveError}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4" noValidate>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {isEditMode ? 'Edit Contract' : 'New Contract'}
                </h2>

                <div>
                    <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Company <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="companyId"
                        name="companyId"
                        value={contract.companyId || ''}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                            validationErrors.companyId ? 'border-red-300' : 'border-gray-300'
                        } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
                    >
                        <option value="">-- Select a Company --</option>
                        {companies.map(comp => (
                            <option key={comp.id} value={comp.id}>{comp.name}</option>
                        ))}
                    </select>
                    {validationErrors.companyId && <p className="mt-1 text-sm text-red-600">{validationErrors.companyId}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Contract Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={contract.name}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                                validationErrors.name ? 'border-red-300' : 'border-gray-300'
                            } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
                        />
                        {validationErrors.name && <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>}
                    </div>

                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Contract Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="code"
                            id="code"
                            value={contract.code}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                                validationErrors.code ? 'border-red-300' : 'border-gray-300'
                            } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
                        />
                        {validationErrors.code && <p className="mt-1 text-sm text-red-600">{validationErrors.code}</p>}
                    </div>

                    <div>
                        <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Total Amount <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="totalAmount"
                            id="totalAmount"
                            step="0.01"
                            value={contract.totalAmount || ''}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                                validationErrors.totalAmount ? 'border-red-300' : 'border-gray-300'
                            } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
                        />
                        {validationErrors.totalAmount && <p className="mt-1 text-sm text-red-600">{validationErrors.totalAmount}</p>}
                    </div>

                    <div>
                        <label htmlFor="amountAvailable" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Amount Available <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="amountAvailable"
                            id="amountAvailable"
                            step="0.01"
                            value={contract.amountAvailable || ''}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                                validationErrors.amountAvailable ? 'border-red-300' : 'border-gray-300'
                            } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
                        />
                        {validationErrors.amountAvailable && <p className="mt-1 text-sm text-red-600">{validationErrors.amountAvailable}</p>}
                    </div>

                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            id="startDate"
                            value={contract.startDate ? contract.startDate.split('T')[0] : ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            id="endDate"
                            value={contract.endDate ? contract.endDate.split('T')[0] : ''}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                                validationErrors.endDate ? 'border-red-300' : 'border-gray-300'
                            } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
                        />
                        {validationErrors.endDate && <p className="mt-1 text-sm text-red-600">{validationErrors.endDate}</p>}
                    </div>

                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                        <select
                            id="status"
                            name="status"
                            value={contract.status}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                        >
                            <option value="OPEN">OPEN</option>
                            <option value="COMPLETED">COMPLETED</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                    <textarea
                        name="notes"
                        id="notes"
                        rows={3}
                        value={contract.notes || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                    ></textarea>
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => navigate('/contracts')}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : (isEditMode ? 'Update Contract' : 'Create Contract')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ContractFormPage;

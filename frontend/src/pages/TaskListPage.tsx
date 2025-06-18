import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Task } from '../types/task';
import { taskService, PageResponse } from '../services/taskService';
// import { FaPen, FaTrash } from 'react-icons/fa';
import { FaPen } from "@react-icons/all-files/fa/FaPen"
import { FaTrash } from "@react-icons/all-files/fa/FaTrash"
import { FaCheck } from "@react-icons/all-files/fa/FaCheck"

const TaskListPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const searchTermRef = useRef<HTMLInputElement>(null);
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10); // You can adjust default page size
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Billing status states
    const [billingStatusModalOpen, setBillingStatusModalOpen] = useState(false);
    const [selectedBillingStatus, setSelectedBillingStatus] = useState<boolean | null>(null);
    const [billingDate, setBillingDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [invoiceId, setInvoiceId] = useState<string>('');

    // Payment status states
    const [paymentStatusModalOpen, setPaymentStatusModalOpen] = useState(false);
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<boolean | null>(null);
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Info For Bill modal state
    const [infoForBillModalOpen, setInfoForBillModalOpen] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Type filter state
    const [typeFilter, setTypeFilter] = useState<string | null>(null);

    // Compute info for bill
    const taskIdsString = tasks.map(task => task.ticketId).join(', ');
    const totalAmount = tasks.reduce((sum, task) => sum + (task.hoursWorked * (task.rateUsed ?? 0)), 0);

    const handleCopy = (value: string, field: string) => {
        navigator.clipboard.writeText(value);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 1000);
    };

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const fetchTasks = async () => { 
            try {
                setLoading(true);
                const response = await taskService.getTasks(
                    projectId ? parseInt(projectId) : undefined,
                    currentPage,
                    pageSize,
                    debouncedSearchTerm // Use debounced search term
                );
                let filteredTasks = response.content;
                if (typeFilter) {
                    filteredTasks = filteredTasks.filter(task => task.type === typeFilter);
                }
                setTasks(filteredTasks);
                setTotalPages(response.totalPages);
                setTotalElements(response.totalElements);
        
            } catch (err) {
                setError('Failed to fetch tasks. Please try again later.');
                console.error('Error fetching tasks:', err);
            } finally {
                setLoading(false);        
            }
        };

        fetchTasks();

    }, [projectId, currentPage, pageSize, debouncedSearchTerm, typeFilter]); // Add typeFilter to dependencies

    useEffect(() => {
        if (searchTermRef.current && !loading) {
            searchTermRef.current.focus();
        }
    }, [loading, searchTerm]);

    const handleDelete = async (taskId: number) => {
        try {
            if (projectId) {
                await taskService.deleteTask(parseInt(projectId), taskId);
                // After deletion, re-fetch tasks for the current page with current filters
                const response = await taskService.getTasks(
                    projectId ? parseInt(projectId) : undefined,
                    currentPage,
                    pageSize,
                    debouncedSearchTerm
                );
                setTasks(response.content);
                setTotalPages(response.totalPages);
                setTotalElements(response.totalElements);
                setDeleteModalOpen(false);
                setTaskToDelete(null);
            }
        } catch (err) {
            setError('Failed to delete task. Please try again later.');
            console.error('Error deleting task:', err);
        }
    };

    const openDeleteModal = (task: Task) => {
        setTaskToDelete(task);
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setTaskToDelete(null);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setPageSize(parseInt(event.target.value));
        setCurrentPage(0); // Reset to first page when page size changes
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        setCurrentPage(0); // Reset to first page when search term changes        
    };

    const handleBillingStatusUpdate = async () => {
        if (selectedBillingStatus === null) return;

        try {
            const taskUpdates = tasks.map(task => ({
                taskId: task.id!,
                isBilled: selectedBillingStatus,
                billingDate: billingDate,
                invoiceId: invoiceId
            }));

            await taskService.updateTasksBillingStatus(taskUpdates);
            
            // Refresh the task list
            const response = await taskService.getTasks(
                projectId ? parseInt(projectId) : undefined,
                currentPage,
                pageSize,
                debouncedSearchTerm
            );
            setTasks(response.content);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
            
            setBillingStatusModalOpen(false);
            setSelectedBillingStatus(null);
            setBillingDate(new Date().toISOString().split('T')[0]);
            setInvoiceId('');
        } catch (err) {
            setError('Failed to update billing status. Please try again later.');
            console.error('Error updating billing status:', err);
        }
    };

    const handlePaymentStatusUpdate = async () => {
        if (selectedPaymentStatus === null) return;

        try {
            const taskUpdates = tasks.map(task => ({
                taskId: task.id!,
                isPaid: selectedPaymentStatus,
                paymentDate: paymentDate
            }));

            await taskService.updateTasksPaymentStatus(taskUpdates);
            
            // Refresh the task list
            const response = await taskService.getTasks(
                projectId ? parseInt(projectId) : undefined,
                currentPage,
                pageSize,
                debouncedSearchTerm
            );
            setTasks(response.content);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
            
            setPaymentStatusModalOpen(false);
            setSelectedPaymentStatus(null);
            setPaymentDate(new Date().toISOString().split('T')[0]);
        } catch (err) {
            setError('Failed to update payment status. Please try again later.');
            console.error('Error updating payment status:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-3" role="alert">
                <span className="block sm:inline">{error}</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            {/* Delete Confirmation Modal */}
            {deleteModalOpen && taskToDelete && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                    <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                                <svg className="h-6 w-6 text-red-600 dark:text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-2">Delete Task</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Are you sure you want to delete the task "{taskToDelete.title}"? This action cannot be undone.
                                </p>
                            </div>
                            <div className="flex justify-center space-x-4 mt-4">
                                <button
                                    onClick={closeDeleteModal}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(taskToDelete.id!)}
                                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {projectId ? 'Project Tasks' : 'All Tasks'}
                </h1>
                <div className="flex space-x-4">
                    <button
                        onClick={() => setBillingStatusModalOpen(true)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                    >
                        <FaCheck className="mr-2" />
                        Update Status Billing
                    </button>
                    <button
                        onClick={() => setPaymentStatusModalOpen(true)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                    >
                        <FaCheck className="mr-2" />
                        Update Status Payment
                    </button>
                    <button
                        onClick={() => setInfoForBillModalOpen(true)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                    >
                        Info For Bill
                    </button>
                    <button
                        onClick={() => navigate('/tasks/new')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                    >
                        Add New Task
                    </button>
                </div>
            </div>

            {/* Billing Status Update Modal */}
            {billingStatusModalOpen && (
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
                                    This will update the billing status for all {tasks.length} filtered tasks.
                                </p>
                                <div className="flex flex-col space-y-4">
                                    <div className="flex justify-center space-x-4">
                                        <button
                                            onClick={() => setSelectedBillingStatus(true)}
                                            className={`px-4 py-2 rounded-md ${
                                                selectedBillingStatus === true
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                            }`}
                                        >
                                            Mark as Billed
                                        </button>
                                        <button
                                            onClick={() => setSelectedBillingStatus(false)}
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
                                            onChange={(e) => setBillingDate(e.target.value)}
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
                                            onChange={(e) => setInvoiceId(e.target.value)}
                                            placeholder="Enter invoice ID"
                                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-center space-x-4 mt-4">
                                <button
                                    onClick={() => {
                                        setBillingStatusModalOpen(false);
                                        setSelectedBillingStatus(null);
                                        setBillingDate(new Date().toISOString().split('T')[0]);
                                        setInvoiceId('');
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBillingStatusUpdate}
                                    disabled={selectedBillingStatus === null}
                                    className="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                >
                                    Update
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Status Update Modal */}
            {paymentStatusModalOpen && (
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
                                    This will update the payment status for all {tasks.length} filtered tasks.
                                </p>
                                <div className="flex flex-col space-y-4">
                                    <div className="flex justify-center space-x-4">
                                        <button
                                            onClick={() => setSelectedPaymentStatus(true)}
                                            className={`px-4 py-2 rounded-md ${
                                                selectedPaymentStatus === true
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                            }`}
                                        >
                                            Mark as Paid
                                        </button>
                                        <button
                                            onClick={() => setSelectedPaymentStatus(false)}
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
                                            onChange={(e) => setPaymentDate(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-center space-x-4 mt-4">
                                <button
                                    onClick={() => {
                                        setPaymentStatusModalOpen(false);
                                        setSelectedPaymentStatus(null);
                                        setPaymentDate(new Date().toISOString().split('T')[0]);
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePaymentStatusUpdate}
                                    disabled={selectedPaymentStatus === null}
                                    className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    Update
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Info For Bill Modal */}
            {infoForBillModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
                        <div className="mt-3 text-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-2 mb-4">
                                Info For Bill
                            </h3>
                            <div className="flex flex-col items-start space-y-4">
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
                                            onClick={() => handleCopy(taskIdsString, 'ids')}
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
                                            value={totalAmount.toFixed(2)}
                                            className="flex-1 px-2 py-1 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs"
                                        />
                                        <button
                                            onClick={() => handleCopy(totalAmount.toFixed(2), 'amount')}
                                            className="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 text-xs"
                                        >
                                            {copiedField === 'amount' ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-center space-x-4 mt-6">
                                <button
                                    onClick={() => setInfoForBillModalOpen(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter and Page Size Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex items-center w-full md:w-1/3">
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        ref={searchTermRef}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="flex-1 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <div className="flex items-center ml-4">
                        <label className="text-gray-700 dark:text-gray-300 text-sm mr-2">Evolutiva</label>
                        <input
                            type="checkbox"
                            checked={typeFilter === 'EVOLUTIVA'}
                            onChange={e => setTypeFilter(e.target.checked ? 'EVOLUTIVA' : null)}
                            className="mr-2"
                        />
                        <label className="text-gray-700 dark:text-gray-300 text-sm mr-2">Correttiva</label>
                        <input
                            type="checkbox"
                            checked={typeFilter === 'CORRETTIVA'}
                            onChange={e => setTypeFilter(e.target.checked ? 'CORRETTIVA' : null)}
                        />
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <label htmlFor="pageSizeSelect" className="text-gray-700 dark:text-gray-300">Items per page:</label>
                    <select
                        id="pageSizeSelect"
                        value={pageSize}
                        onChange={handlePageSizeChange}
                        className="p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                </div>
            </div>

            {tasks.length === 0 && !loading ? (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
                    No tasks found.
                </div>
            ) : (
                <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg mb-4">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/12">Task ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-5/12">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-2/12">Project</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/12">Start Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/12">Hours</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/12">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/12">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/12">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {tasks.map((task) => (
                                <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 break-words w-1/12">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{task.ticketId}</div>
                                    </td>
                                    <td className="px-6 py-4 w-5/12 max-w-0">
                                        <div 
                                            className="text-sm text-gray-900 dark:text-white truncate"
                                            title={task.description}
                                        >
                                            {task.description}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 break-words w-2/12">
                                        <div className="text-sm text-gray-900 dark:text-white">{task.projectName}</div>
                                    </td>
                                    <td className="px-6 py-4 break-words w-1/12">
                                        <div className="text-sm text-gray-500 dark:text-gray-300">
                                            {new Date(task.startDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 break-words w-1/12">
                                        <div className="text-sm text-gray-500 dark:text-gray-300">
                                            {task.hoursWorked} hours
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 break-words w-1/12">
                                        <div className="text-sm text-gray-500 dark:text-gray-300">
                                            {task.type || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 break-words w-1/12">
                                        <div className="flex space-x-2">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                task.isBilled ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                            }`}>
                                                {task.isBilled ? 'Billed' : 'Unbilled'}
                                            </span>
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                task.isPaid ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                            }`}>
                                                {task.isPaid ? 'Paid' : 'Unpaid'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium break-words w-1/12">
                                        <button
                                            onClick={() => {
                                                if (task.projectId) {
                                                    navigate(`/companies/${task.projectId}/projects/${task.projectId}/tasks/${task.id}/edit`);
                                                }
                                            }}
                                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                                            title="Edit"
                                        >
                                            <FaPen size={16} className="inline-block" />
                                        </button>
                                        <button
                                            onClick={() => openDeleteModal(task)}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                            title="Delete"
                                        >
                                            <FaTrash size={16} className="inline-block" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-4">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                        Previous
                    </button>
                    <span className="text-gray-700 dark:text-gray-300">
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages - 1}
                        className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default TaskListPage;
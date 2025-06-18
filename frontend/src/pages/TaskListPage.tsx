import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Task } from '../types/task';
import { taskService, PageResponse } from '../services/taskService';
// import { FaPen, FaTrash } from 'react-icons/fa';
import { FaPen } from "@react-icons/all-files/fa/FaPen"
import { FaTrash } from "@react-icons/all-files/fa/FaTrash"

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

    useEffect(() => {
        const fetchTasks = async () => { 
            try {
                setLoading(true);
                const response = await taskService.getTasks(
                    projectId ? parseInt(projectId) : undefined,
                    currentPage,
                    pageSize,
                    searchTerm // Pass searchTerm to the service
                );
                setTasks(response.content);
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

    }, [projectId, currentPage, pageSize, searchTerm]); // Add searchTerm to dependencies

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
                    searchTerm
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
                <button
                    onClick={() => navigate('/tasks/new')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                    Add New Task
                </button>
            </div>

            {/* Filter and Page Size Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-4 md:space-y-0 md:space-x-4">
                <input
                    type="text"
                    placeholder="Search tasks..."
                    ref={searchTermRef}
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
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
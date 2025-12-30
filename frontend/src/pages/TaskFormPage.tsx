import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Task } from '../types/task';
import { Project } from '../types/project';
import { taskService } from '../services/taskService';
import projectService from '../services/projectService';

interface ValidationErrors {
    projectId?: string;
    title?: string;
    startDate?: string;
    hoursWorked?: string;
    rateUsed?: string;
    billingDate?: string;
    paymentDate?: string;
    invoiceId?: string;
}

const TaskFormPage: React.FC = () => {
    const { projectId: urlProjectId, taskId } = useParams<{ projectId: string; taskId: string }>();
    const navigate = useNavigate();
    const [task, setTask] = useState<Task>({
        title: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        hoursWorked: 0,
        isBilled: false,
        isPaid: false,
        referencedTaskId: '',
        type: 'CORRETTIVA',
        currency: 'EUR'
    });
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const isEditMode = !!taskId;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch projects for the dropdown
                const fetchedProjects = await projectService.getAllProjectsForUser();
                setProjects(fetchedProjects);

                if (isEditMode && taskId) {
                    const fetchedTask = await taskService.getTask(parseInt(taskId));
                    setTask(fetchedTask);
                } else if (urlProjectId) {
                    const projectIdNum = parseInt(urlProjectId);
                    const foundProject = fetchedProjects.find(p => p.id === projectIdNum);
                    setTask(prev => ({
                        ...prev,
                        projectId: projectIdNum,
                        rateUsed: foundProject?.hourlyRate
                    }));
                }
            } catch (err) {
                console.error('Error fetching data for task form:', err);
                setError('Failed to load form data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isEditMode, urlProjectId, taskId]);

    const validateForm = (): boolean => {
        const errors: ValidationErrors = {};

        if (!task.projectId) {
            errors.projectId = 'Project is required';
        }
        if (!task.title?.trim()) {
            errors.title = 'Title is required';
        }
        if (!task.startDate) {
            errors.startDate = 'Start date is required';
        }
        if (!task.hoursWorked || task.hoursWorked <= 0) {
            errors.hoursWorked = 'Hours worked must be greater than 0';
        }
        if (task.rateUsed && task.rateUsed <= 0) {
            errors.rateUsed = 'Rate used must be greater than 0';
        }
        if (task.isBilled && !task.billingDate) {
            errors.billingDate = 'Billing date is required when task is billed';
        }
        if (task.isPaid && !task.paymentDate) {
            errors.paymentDate = 'Payment date is required when task is paid';
        }
        if (task.isBilled && !task.invoiceId?.trim()) {
            errors.invoiceId = 'Invoice ID is required when task is billed';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (name === 'projectId') {
            const projectIdNum = parseInt(value);
            const foundProject = projects.find(p => p.id === projectIdNum);
            setTask(prev => ({
                ...prev,
                projectId: projectIdNum,
                // Only set rateUsed if the user hasn't already set it or if it's empty-
                rateUsed: foundProject?.hourlyRate
            }));
        } else {
            setTask(prev => ({
                ...prev,
                [name]: type === 'number' ? parseFloat(value) : value
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setShowConfirmModal(true);
    };

    const generateRandomTaskId = (): string => {
        const year = new Date().getFullYear();
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomPart = '';
        for (let i = 0; i < 6; i++) {
            randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `TSK-${year}-${randomPart}`;
    };

    const handleConfirmSave = async () => {
        try {
            // Generate random task ID if creating new task and ticketId is empty
            if (!taskId && (!task.ticketId || task.ticketId.trim() === '')) {
                task.ticketId = generateRandomTaskId();
            }

            if (taskId) {
                // Update existing task
                if (task.projectId) {
                    await taskService.updateTask(task.projectId, parseInt(taskId), task);
                }
            } else {
                // Create new task
                if (task.projectId) {
                    await taskService.createTask(task.projectId, task);
                }
            }
            navigate(-1);
        } catch (err) {
            setError('Failed to save task. Please try again later.');
            console.error('Error saving task:', err);
        } finally {
            setShowConfirmModal(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading form...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center min-h-screen">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                    <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                                <svg className="h-6 w-6 text-green-600 dark:text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-2">
                                {isEditMode ? 'Update Task' : 'Create Task'}
                            </h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Are you sure you want to {isEditMode ? 'update' : 'create'} this task?
                                </p>
                            </div>
                            <div className="flex justify-center space-x-4 mt-4">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmSave}
                                    className="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4" noValidate>
                {/* Project Selection */}
                <div>
                    <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Project <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="projectId"
                        name="projectId"
                        value={task.projectId || ''}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                            validationErrors.projectId ? 'border-red-300' : 'border-gray-300'
                        } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
                        // disabled={!!urlProjectId}
                    >
                        <option value="">-- Select a Project --</option>
                        {projects.map(project => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </select>
                    {validationErrors.projectId && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.projectId}</p>
                    )}
                </div>

                {/* Task Title */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Task Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="title"
                        id="title"
                        value={task.title || ''}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                            validationErrors.title ? 'border-red-300' : 'border-gray-300'
                        } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
                    />
                    {validationErrors.title && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.title}</p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description
                    </label>
                    <textarea
                        name="description"
                        id="description"
                        rows={3}
                        value={task.description || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                    ></textarea>
                </div>

                {/* Ticket ID */}
                <div>
                    <label htmlFor="ticketId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ticket ID
                    </label>
                    <input
                        type="text"
                        name="ticketId"
                        id="ticketId"
                        value={task.ticketId || ''}
                        onChange={handleChange}
                        placeholder={isEditMode ? '' : 'Will be auto-generated if left empty'}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                    />
                </div>

                {/* Referenced Task ID */}
                <div>
                    <label htmlFor="referencedTaskId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Referenced Task ID
                    </label>
                    <input
                        type="text"
                        name="referencedTaskId"
                        id="referencedTaskId"
                        value={task.referencedTaskId || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                    />
                </div>

                {/* Start Date */}
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        name="startDate"
                        id="startDate"
                        value={task.startDate || ''}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                            validationErrors.startDate ? 'border-red-300' : 'border-gray-300'
                        } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
                    />
                    {validationErrors.startDate && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.startDate}</p>
                    )}
                </div>

                {/* End Date */}
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        End Date
                    </label>
                    <input
                        type="date"
                        name="endDate"
                        id="endDate"
                        value={task.endDate || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                    />
                </div>

                {/* Hours Worked */}
                <div>
                    <label htmlFor="hoursWorked" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Hours Worked <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="hoursWorked"
                        id="hoursWorked"
                        step="0.5"
                        min="0"
                        value={task.hoursWorked || 0}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                            validationErrors.hoursWorked ? 'border-red-300' : 'border-gray-300'
                        } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
                    />
                    {validationErrors.hoursWorked && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.hoursWorked}</p>
                    )}
                </div>

                {/* Rate Used */}
                <div>
                    <label htmlFor="rateUsed" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Rate Used
                    </label>
                    <input
                        type="number"
                        name="rateUsed"
                        id="rateUsed"
                        step="0.01"
                        min="0"
                        value={task.rateUsed || ''}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                            validationErrors.rateUsed ? 'border-red-300' : 'border-gray-300'
                        } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
                    />
                    {validationErrors.rateUsed && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.rateUsed}</p>
                    )}
                </div>

                {/* Rate Type */}
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Project Type
                    </label>
                    <select
                        name="type"
                        id="type"
                        value={task.type || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                    >
                        <option value="">-- Select Project Type --</option>
                        <option value="EVOLUTIVA">Evolutiva</option>
                        <option value="CORRETTIVA">Correttiva</option>
                    </select>
                </div>

                {/* Currency */}
                <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Currency
                    </label>
                    <select
                        name="currency"
                        id="currency"
                        value={task.currency || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                    >
                        <option value="">-- Select Currency --</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                    </select>
                </div>

                {/* Billing Status */}
                <div className="flex items-center space-x-4">
                    <div>
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                name="isBilled"
                                checked={task.isBilled || false}
                                onChange={(e) => setTask(prev => ({
                                    ...prev,
                                    isBilled: e.target.checked,
                                    billingDate: e.target.checked ? prev.billingDate : undefined,
                                    invoiceId: e.target.checked ? prev.invoiceId : undefined
                                }))}
                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Billed</span>
                        </label>
                    </div>
                    <div>
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                name="isPaid"
                                checked={task.isPaid || false}
                                onChange={(e) => setTask(prev => ({
                                    ...prev,
                                    isPaid: e.target.checked,
                                    paymentDate: e.target.checked ? prev.paymentDate : undefined
                                }))}
                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Paid</span>
                        </label>
                    </div>
                </div>

                {/* Billing Date */}
                {task.isBilled && (
                    <div>
                        <label htmlFor="billingDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Billing Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="billingDate"
                            id="billingDate"
                            value={task.billingDate || ''}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                                validationErrors.billingDate ? 'border-red-300' : 'border-gray-300'
                            } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
                        />
                        {validationErrors.billingDate && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.billingDate}</p>
                        )}
                    </div>
                )}

                {/* Payment Date */}
                {task.isPaid && (
                    <div>
                        <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Payment Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="paymentDate"
                            id="paymentDate"
                            value={task.paymentDate || ''}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                                validationErrors.paymentDate ? 'border-red-300' : 'border-gray-300'
                            } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
                        />
                        {validationErrors.paymentDate && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.paymentDate}</p>
                        )}
                    </div>
                )}

                {/* Invoice ID */}
                {task.isBilled && (
                    <div>
                        <label htmlFor="invoiceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Invoice ID <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="invoiceId"
                            id="invoiceId"
                            value={task.invoiceId || ''}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                                validationErrors.invoiceId ? 'border-red-300' : 'border-gray-300'
                            } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
                        />
                        {validationErrors.invoiceId && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.invoiceId}</p>
                        )}
                    </div>
                )}

                {/* Notes */}
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Notes
                    </label>
                    <textarea
                        name="notes"
                        id="notes"
                        rows={3}
                        value={task.notes || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                    ></textarea>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {isEditMode ? 'Update Task' : 'Create Task'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TaskFormPage; 
import api from './api';
import { Task } from '../types/task';

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

interface TaskBillingStatusUpdate {
    taskId: number;
    isBilled: boolean;
    billingDate: string; // ISO date string format
    invoiceId: string;
}

export interface TaskPaymentStatusUpdate {
    taskId: number;
    isPaid: boolean;
    paymentDate: string;
}

export const taskService = {
    // Create a new task
    async createTask(projectId: number, task: Task): Promise<Task> {
        const response = await api.post<Task>(`/projects/${projectId}/tasks`, task);
        return response.data;
    },

    // Update an existing task
    async updateTask(projectId: number, id: number, task: Task): Promise<Task> {
        const response = await api.put<Task>(`/projects/${projectId}/tasks/${id}`, task);
        return response.data;
    },

    // Delete a task
    async deleteTask(projectId: number, id: number): Promise<void> {
        await api.delete(`/projects/${projectId}/tasks/${id}`);
    },

    // Get a single task by ID
    async getTask(id: number): Promise<Task> {
        const response = await api.get<Task>(`/tasks/${id}`);
        return response.data;
    },

    // Get all tasks for the authenticated user with pagination and filtering
    async getTasks(
        projectId?: number, 
        page: number = 0, 
        size: number = 10, 
        searchTerm?: string,
        isBilled?: boolean | null,
        isPaid?: boolean | null,
        sort?: string,
        type?: string
    ): Promise<PageResponse<Task>> {
        // Check if projectId is a valid number (including 0)
        // projectId can be 0, which is falsy but valid, so we need to check explicitly
        // Also handle case where projectId might be passed as a string
        let numericProjectId: number | undefined = undefined;
        if (projectId !== undefined && projectId !== null) {
            if (typeof projectId === 'number') {
                numericProjectId = isNaN(projectId) ? undefined : projectId;
            } else if (typeof projectId === 'string') {
                const parsed = parseInt(projectId, 10);
                numericProjectId = isNaN(parsed) ? undefined : parsed;
            }
        }
        const hasProjectId = numericProjectId !== undefined;
        
        console.log('taskService.getTasks - projectId:', projectId, 'type:', typeof projectId, 'numericProjectId:', numericProjectId, 'hasProjectId:', hasProjectId);
        
        const url = hasProjectId
            ? `/projects/${numericProjectId}/tasks`
            : '/tasks';
        const params: any = { page, size };
        if (searchTerm) {
            params.search = searchTerm;
        }
        // Only add projectId filter if we're using the /tasks endpoint (not /projects/{id}/tasks)
        // This is for the /tasks endpoint which accepts projectId as a query parameter
        if (!url.includes('/projects/') && hasProjectId) {
            params.projectId = numericProjectId;
        }
        if (isBilled !== undefined && isBilled !== null) {
            params.isBilled = isBilled;
        }
        if (isPaid !== undefined && isPaid !== null) {
            params.isPaid = isPaid;
        }
        if (type) {
            params.type = type;
        }
        if (sort) {
            params.sort = sort;
        }
        console.log('taskService.getTasks - Final URL:', url, 'params:', params);
        const response = await api.get<PageResponse<Task>>(url, {
            params
        });
        return response.data;
    },

    // Get tasks by date range for a project
    async getTasksByDateRange(projectId: number, startDate: string, endDate: string): Promise<PageResponse<Task>> {
        const response = await api.get<PageResponse<Task>>(`/projects/${projectId}/tasks/date-range`, {
            params: { startDate, endDate }
        });
        return response.data;
    },

    // Get all unbilled tasks
    async getUnbilledTasks(): Promise<PageResponse<Task>> {
        const response = await api.get<PageResponse<Task>>('/tasks/unbilled');
        return response.data;
    },

    // Get all unpaid tasks
    async getUnpaidTasks(): Promise<PageResponse<Task>> {
        const response = await api.get<PageResponse<Task>>('/tasks/unpaid');
        return response.data;
    },

    // Get unbilled tasks for a specific project
    async getUnbilledTasksByProject(projectId: number): Promise<PageResponse<Task>> {
        const response = await api.get<PageResponse<Task>>(`/projects/${projectId}/tasks/unbilled`);
        return response.data;
    },

    // Get unpaid tasks for a specific project
    async getUnpaidTasksByProject(projectId: number): Promise<PageResponse<Task>> {
        const response = await api.get<PageResponse<Task>>(`/projects/${projectId}/tasks/unpaid`);
        return response.data;
    },

    // User-specific endpoints
    async getUserTasks(): Promise<PageResponse<Task>> {
        const response = await api.get<PageResponse<Task>>('/user/tasks');
        return response.data;
    },

    async getUserTasksByProject(projectId: number): Promise<PageResponse<Task>> {
        const response = await api.get<PageResponse<Task>>(`/user/projects/${projectId}/tasks`);
        return response.data;
    },

    async getUserUnbilledTasks(): Promise<PageResponse<Task>> {
        const response = await api.get<PageResponse<Task>>('/user/tasks/unbilled');
        return response.data;
    },

    async getUserUnpaidTasks(): Promise<PageResponse<Task>> {
        const response = await api.get<PageResponse<Task>>('/user/tasks/unpaid');
        return response.data;
    },

    async getUserUnbilledTasksByProject(projectId: number): Promise<PageResponse<Task>> {
        const response = await api.get<PageResponse<Task>>(`/user/projects/${projectId}/tasks/unbilled`);
        return response.data;
    },

    async getUserUnpaidTasksByProject(projectId: number): Promise<PageResponse<Task>> {
        const response = await api.get<PageResponse<Task>>(`/user/projects/${projectId}/tasks/unpaid`);
        return response.data;
    },

    async updateTasksBillingStatus(taskUpdates: TaskBillingStatusUpdate[]): Promise<Task[]> {
        const response = await api.put<Task[]>(`/tasks/billing-status`, taskUpdates);
        return response.data;
    },

    async updateTasksPaymentStatus(taskUpdates: TaskPaymentStatusUpdate[]): Promise<Task[]> {
        const response = await api.put<Task[]>(`/tasks/payment-status`, taskUpdates);
        return response.data;
    },

    // Generate SAL PDF for Dedagroup
    async generateSalPdf(
        year: number,
        month: number,
        projectId?: number,
        userName?: string,
        userAddress?: string,
        userPhone?: string,
        userEmailAddress?: string,
        projectName?: string
    ): Promise<Blob> {
        const params: any = { year, month };
        if (projectId !== undefined) {
            params.projectId = projectId;
        }
        if (userName) {
            params.userName = userName;
        }
        if (userAddress) {
            params.userAddress = userAddress;
        }
        if (userPhone) {
            params.userPhone = userPhone;
        }
        if (userEmailAddress) {
            params.userEmailAddress = userEmailAddress;
        }
        if (projectName) {
            params.projectName = projectName;
        }
        const response = await api.get('/tasks/sal/pdf', {
            params,
            responseType: 'blob'
        });
        return response.data;
    }
}; 
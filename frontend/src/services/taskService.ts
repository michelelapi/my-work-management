import api from './api';
import { Task } from '../types/task';

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
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
    async getTasks(projectId?: number, page: number = 0, size: number = 10, searchTerm?: string): Promise<PageResponse<Task>> {
        const url = projectId 
            ? `/projects/${projectId}/tasks`
            : '/tasks';
        const params: any = { page, size };
        if (searchTerm) {
            params.search = searchTerm;
        }
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
    }
}; 
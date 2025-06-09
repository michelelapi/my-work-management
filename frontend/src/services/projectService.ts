import api from './api';
import { Project } from '../types/project';

const projectService = {
  // Fetch all projects for a given company
  async getAllProjectsByCompanyId(companyId: number): Promise<Project[]> {
    const response = await api.get(`/companies/${companyId}/projects`);
    // Assuming the backend returns a Page object, extract the content array
    return response.data.content || [];
  },

  // Fetch all projects for the authenticated user
  async getAllProjectsForUser(): Promise<Project[]> {
    const response = await api.get('/projects');
    // Assuming the backend returns a Page object, extract the content array
    return response.data.content || [];
  },

  // Fetch a single project by ID for a given company
  async getProjectById(companyId: number, projectId: number): Promise<Project> {
    const response = await api.get(`/companies/${companyId}/projects/${projectId}`);
    return response.data;
  },

  // Create a new project for a given company
  async createProject(companyId: number, project: Project): Promise<Project> {
    const response = await api.post(`/companies/${companyId}/projects`, project);
    return response.data;
  },

  // Update an existing project for a given company
  async updateProject(companyId: number, projectId: number, project: Project): Promise<Project> {
    const response = await api.put(`/companies/${companyId}/projects/${projectId}`, project);
    return response.data;
  },

  // Delete a project for a given company
  async deleteProject(companyId: number, projectId: number): Promise<void> {
    await api.delete(`/companies/${companyId}/projects/${projectId}`);
  },

  // Search projects for a given company
  async searchProjects(companyId: number, searchTerm: string): Promise<Project[]> {
    const response = await api.get(`/companies/${companyId}/projects/search`, { params: { searchTerm } });
    return response.data.content || [];
  },
};

export default projectService; 
import api from './api';
import { Client } from '../types/client';

const clientService = {
  // Fetch all clients for a given project
  async getAllClientsByProjectId(projectId: number): Promise<Client[]> {
    const response = await api.get(`/projects/${projectId}/clients`);
    return response.data;
  },

  // Fetch a single client by ID for a given project
  async getClientById(projectId: number, clientId: number): Promise<Client> {
    const response = await api.get(`/projects/${projectId}/clients/${clientId}`);
    return response.data;
  },

  // Create a new client for a given project
  async createClient(projectId: number, client: Client): Promise<Client> {
    const response = await api.post(`/projects/${projectId}/clients`, client);
    return response.data;
  },

  // Update an existing client for a given project
  async updateClient(projectId: number, clientId: number, client: Client): Promise<Client> {
    const response = await api.put(`/projects/${projectId}/clients/${clientId}`, client);
    return response.data;
  },

  // Delete a client for a given project
  async deleteClient(projectId: number, clientId: number): Promise<void> {
    await api.delete(`/projects/${projectId}/clients/${clientId}`);
  },
};

export default clientService;

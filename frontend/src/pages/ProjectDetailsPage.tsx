import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project, ProjectStatus } from '../types/project';
import { Client } from '../types/client';
import projectService from '../services/projectService';
import clientService from '../services/clientService';

interface ProjectSectionsState {
  isClientsExpanded: boolean;
}

const ProjectDetailsPage: React.FC = () => {
  const { companyId, projectId } = useParams<{ companyId: string; projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClientsExpanded, setIsClientsExpanded] = useState(true);
  const [deleteClientModalOpen, setDeleteClientModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientFormData, setClientFormData] = useState<Client>({
    projectId: 0,
    name: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    projectManagerName: '',
  });

  // Load sections state from localStorage
  useEffect(() => {
    if (projectId) {
      const savedState = localStorage.getItem(`project-sections-${projectId}`);
      if (savedState) {
        const { isClientsExpanded } = JSON.parse(savedState) as ProjectSectionsState;
        setIsClientsExpanded(isClientsExpanded ?? true);
      }
    }
  }, [projectId]);

  // Save sections state to localStorage
  const saveSectionsState = (clientsExpanded: boolean) => {
    if (projectId) {
      const state: ProjectSectionsState = {
        isClientsExpanded: clientsExpanded,
      };
      localStorage.setItem(`project-sections-${projectId}`, JSON.stringify(state));
    }
  };

  // Update clients expanded state
  const handleClientsToggle = (expanded: boolean) => {
    setIsClientsExpanded(expanded);
    saveSectionsState(expanded);
  };

  useEffect(() => {
    if (!companyId || !projectId) return;
    const companyIdNum = parseInt(companyId, 10);
    const projectIdNum = parseInt(projectId, 10);
    if (isNaN(companyIdNum) || isNaN(projectIdNum)) {
      setError('Invalid company or project ID');
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [projectData, clientsData] = await Promise.all([
          projectService.getProjectById(companyIdNum, projectIdNum),
          clientService.getAllClientsByProjectId(projectIdNum)
        ]);
        setProject(projectData);
        setClients(clientsData);
      } catch (err) {
        console.error('Error fetching project details:', err);
        setError('Failed to load project details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [companyId, projectId]);

  const handleDeleteClient = async (clientId: number) => {
    if (!projectId) return;

    try {
      await clientService.deleteClient(parseInt(projectId, 10), clientId);
      setClients(clients.filter(client => client.id !== clientId));
      setDeleteClientModalOpen(false);
      setClientToDelete(null);
    } catch (err) {
      console.error('Error deleting client:', err);
      setError('Failed to delete client');
    }
  };

  const openDeleteClientModal = (client: Client) => {
    setClientToDelete(client);
    setDeleteClientModalOpen(true);
  };

  const closeDeleteClientModal = () => {
    setDeleteClientModalOpen(false);
    setClientToDelete(null);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setClientFormData({
      projectId: client.projectId,
      name: client.name,
      description: client.description || '',
      contactEmail: client.contactEmail || '',
      contactPhone: client.contactPhone || '',
      projectManagerName: client.projectManagerName || '',
    });
    setShowClientForm(true);
  };

  const handleNewClient = () => {
    setEditingClient(null);
    setClientFormData({
      projectId: projectId ? parseInt(projectId, 10) : 0,
      name: '',
      description: '',
      contactEmail: '',
      contactPhone: '',
      projectManagerName: '',
    });
    setShowClientForm(true);
  };

  const handleClientFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    try {
      if (editingClient) {
        const updated = await clientService.updateClient(
          parseInt(projectId, 10),
          editingClient.id!,
          clientFormData
        );
        setClients(clients.map(c => c.id === updated.id ? updated : c));
      } else {
        const created = await clientService.createClient(
          parseInt(projectId, 10),
          clientFormData
        );
        setClients([...clients, created]);
      }
      setShowClientForm(false);
      setEditingClient(null);
      setClientFormData({
        projectId: parseInt(projectId, 10),
        name: '',
        description: '',
        contactEmail: '',
        contactPhone: '',
        projectManagerName: '',
      });
    } catch (err) {
      console.error('Error saving client:', err);
      setError('Failed to save client');
    }
  };

  const handleCancelClientForm = () => {
    setShowClientForm(false);
    setEditingClient(null);
    setClientFormData({
      projectId: projectId ? parseInt(projectId, 10) : 0,
      name: '',
      description: '',
      contactEmail: '',
      contactPhone: '',
      projectManagerName: '',
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error || !project) {
    return <div className="text-red-500 text-center min-h-screen">{error || 'Project not found'}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Project Details Section */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{project.description}</p>
          </div>
          <button
            onClick={() => navigate(`/companies/${companyId}/projects/${projectId}/edit`)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Edit Project
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Project Information</h3>
            <p className="mt-1 text-gray-900 dark:text-white">
              Status: <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                project.status === ProjectStatus.ACTIVE ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                project.status === ProjectStatus.COMPLETED ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                project.status === ProjectStatus.ON_HOLD ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {project.status}
              </span>
            </p>
            <p className="mt-1 text-gray-900 dark:text-white">
              Start Date: {project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}
            </p>
            <p className="mt-1 text-gray-900 dark:text-white">
              End Date: {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Financial Information</h3>
            <p className="mt-1 text-gray-900 dark:text-white">
              Daily Rate: {project.dailyRate ? 
                `${project.currency === 'EUR' ? '€' : '$'}${project.dailyRate}` : 
                '-'
              }
            </p>
            <p className="mt-1 text-gray-900 dark:text-white">
              Hourly Rate: {project.hourlyRate ? 
                `${project.currency === 'EUR' ? '€' : '$'}${project.hourlyRate}` : 
                '-'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Delete Client Confirmation Modal */}
      {deleteClientModalOpen && clientToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                <svg className="h-6 w-6 text-red-600 dark:text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-2">Delete Client</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete the client "{clientToDelete.name}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={closeDeleteClientModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteClient(clientToDelete.id!)}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Form Modal */}
      {showClientForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800 m-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h3>
            <form onSubmit={handleClientFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="clientName"
                  required
                  value={clientFormData.name}
                  onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="clientDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  id="clientDescription"
                  rows={3}
                  value={clientFormData.description}
                  onChange={(e) => setClientFormData({ ...clientFormData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="projectManagerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Project Manager Name
                </label>
                <input
                  type="text"
                  id="projectManagerName"
                  value={clientFormData.projectManagerName || ''}
                  onChange={(e) => setClientFormData({ ...clientFormData, projectManagerName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contact Email
                </label>
                <input
                  type="email"
                  id="clientEmail"
                  value={clientFormData.contactEmail}
                  onChange={(e) => setClientFormData({ ...clientFormData, contactEmail: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  id="clientPhone"
                  value={clientFormData.contactPhone}
                  onChange={(e) => setClientFormData({ ...clientFormData, contactPhone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
              </div>
              <div className="flex justify-end space-x-4 mt-4">
                <button
                  type="button"
                  onClick={handleCancelClientForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {editingClient ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clients Section */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <button
              onClick={() => handleClientsToggle(!isClientsExpanded)}
              className="mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg
                className={`w-5 h-5 transform transition-transform ${isClientsExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Clients</h2>
          </div>
          <button
            onClick={handleNewClient}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Add Client
          </button>
        </div>

        {isClientsExpanded && (
          <>
            {clients.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-4">
                No clients found. Add your first client!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project Manager</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {clients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {client.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-300">
                            {client.projectManagerName || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 dark:text-gray-300">
                            {client.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-300">
                            {client.contactEmail && <div>{client.contactEmail}</div>}
                            {client.contactPhone && <div>{client.contactPhone}</div>}
                            {!client.contactEmail && !client.contactPhone && '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditClient(client)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteClientModal(client)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};

export default ProjectDetailsPage; 
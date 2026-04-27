import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project, ProjectStatus } from '../types/project';
import { Company } from '../types/company'; // Import Company type for company selection
import { Client } from '../types/client';
import projectService from '../services/projectService';
import companyService from '../services/companyService'; // Import company service for fetching companies
import clientService from '../services/clientService';

interface ValidationErrors {
  companyId?: string;
  name?: string;
  dailyRate?: string;
  hourlyRate?: string;
  currency?: string;
  startDate?: string;
  endDate?: string;
  estimatedHours?: string;
  status?: string;
}

const ProjectFormPage: React.FC = () => {
  const { companyId, projectId } = useParams<{ companyId: string; projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project>({
    companyId: companyId ? parseInt(companyId, 10) : 0,
    name: '',
    status: ProjectStatus.ACTIVE,
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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

  const isEditMode = !!projectId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch companies for the dropdown, if not in edit mode with pre-selected company
        const fetchedCompanies = await companyService.getAllCompanies();
        setCompanies(fetchedCompanies);

        if (isEditMode && companyId && projectId) {
          const projectIdNum = parseInt(projectId, 10);
          const [fetchedProject, fetchedClients] = await Promise.all([
            projectService.getProjectById(parseInt(companyId, 10), projectIdNum),
            clientService.getAllClientsByProjectId(projectIdNum)
          ]);
          setProject(fetchedProject);
          setClients(fetchedClients);
        } else if (companyId) {
          setProject(prev => ({ ...prev, companyId: parseInt(companyId, 10) }));
        }
      } catch (err) {
        console.error('Error fetching data for project form:', err);
        setError('Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isEditMode, companyId, projectId]);

  const validateField = (name: string, value: string | number | undefined): string | undefined => {
    switch (name) {
      case 'companyId':
        if (!value || value === 0) return 'Company is required';
        break;
      case 'name':
        if (!value) return 'Project name is required';
        if (typeof value === 'string' && value.length < 2) return 'Project name must be at least 2 characters';
        break;
      case 'dailyRate':
        if (!value) return 'Daily Rate is required';
        if (value !== undefined && value !== null && Number(value) < 0) return 'Daily Rate must be a positive number';
        break;
      case 'hourlyRate':
        if (!value) return 'Hourly Rate is required';
        if (value !== undefined && value !== null && Number(value) < 0) return 'Hourly Rate must be a positive number';
        break;
      case 'currency':
        if (!value) return 'Currency is required';
        if (typeof value === 'string' && !['EUR', 'USD'].includes(value)) return 'Currency must be EUR or USD';
        break;
      case 'startDate':
        if (!value) return 'Start Date is required';
        const startDate = project.startDate ? new Date(project.startDate) : undefined;
        const endDate = project.endDate ? new Date(project.endDate) : undefined;

        if (startDate && endDate && startDate > endDate) return 'Start date cannot be after end date';
        break;
      case 'endDate':
        const currentEndDate = value ? new Date(value as string) : undefined;
        const currentStartDate = project.startDate ? new Date(project.startDate) : undefined;
        if (currentStartDate && currentEndDate && currentStartDate > currentEndDate) return 'End date cannot be before start date';
        break;
      case 'estimatedHours':
        if (value !== undefined && value !== null && Number(value) < 0) return 'Estimated Hours must be a positive number';
        break;
      case 'status':
        if (!value) return 'Status is required';
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    const fieldsToValidate: Array<keyof ValidationErrors> = [
      'companyId',
      'name',
      'dailyRate',
      'hourlyRate',
      'currency',
      'startDate',
      'endDate',
      'estimatedHours',
      'status',
    ];

    fieldsToValidate.forEach((field) => {
      let valueToValidate: string | number | undefined;
      if (field === 'companyId' || field === 'dailyRate' || field === 'hourlyRate' || field === 'estimatedHours') {
        valueToValidate = project[field];
      } else if (field === 'startDate' || field === 'endDate') {
        // For date inputs, we need to compare the string values directly or convert to Date objects
        const dateValue = project[field];
        if (typeof dateValue === 'string') {
          valueToValidate = dateValue.split('T')[0];
        } else {
          valueToValidate = undefined;
        }
      } else {
        valueToValidate = project[field] as string | undefined;
      }

      const error = validateField(field, valueToValidate);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProject(prev => ({
      ...prev,
      [name]: name === 'companyId' || name === 'estimatedHours' || name === 'dailyRate' || name === 'hourlyRate' || name === 'defaultClientId' ? (value ? Number(value) : undefined) : value,
      status: name === 'status' ? (value as ProjectStatus) : prev.status,
      startDate: name === 'startDate' ? value : prev.startDate,
      endDate: name === 'endDate' ? value : prev.endDate,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setSaveError(null);
    setIsSaving(true);

    try {
      if (isEditMode && projectId) {
        await projectService.updateProject(project.companyId, parseInt(projectId, 10), project);
      } else {
        const createdProject = await projectService.createProject(project.companyId, project);
        // After creating, navigate to edit mode so clients can be managed
        if (createdProject.id) {
          navigate(`/companies/${project.companyId}/projects/${createdProject.id}/edit`);
          return;
        }
      }
      navigate(`/companies/${project.companyId}`);
    } catch (err) {
      console.error('Error saving project:', err);
      setSaveError(`Failed to save project: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
      setShowConfirmModal(false);
    }
  };

  const handleDeleteClient = async (clientId: number) => {
    if (!projectId) return;

    try {
      await clientService.deleteClient(parseInt(projectId, 10), clientId);
      setClients(clients.filter(client => client.id !== clientId));
      if (project.defaultClientId === clientId) {
        setProject(prev => ({ ...prev, defaultClientId: undefined }));
      }
      setDeleteClientModalOpen(false);
      setClientToDelete(null);
    } catch (err) {
      console.error('Error deleting client:', err);
      setSaveError('Failed to delete client');
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
    if (!projectId) return;
    setEditingClient(null);
    setClientFormData({
      projectId: parseInt(projectId, 10),
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
    e.stopPropagation(); // Prevent event bubbling
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
        // Initialize default client when adding the first client.
        setProject(prev => ({
          ...prev,
          defaultClientId: prev.defaultClientId ?? created.id
        }));
      }
      // Close the modal and reset form, but stay on the same page
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
      // Clear any previous errors
      setSaveError(null);
    } catch (err) {
      console.error('Error saving client:', err);
      setSaveError(`Failed to save client: ${err instanceof Error ? err.message : 'Unknown error'}`);
      // Don't close the modal on error so user can fix and retry
    }
  };

  const handleCancelClientForm = () => {
    setShowClientForm(false);
    setEditingClient(null);
    if (projectId) {
      setClientFormData({
        projectId: parseInt(projectId, 10),
        name: '',
        description: '',
        contactEmail: '',
        contactPhone: '',
        projectManagerName: '',
      });
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
                {isEditMode ? 'Update Project' : 'Create Project'}
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to {isEditMode ? 'update' : 'create'} this project?
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
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
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
        {/* Company Selection */}
        <div>
          <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Company <span className="text-red-500">*</span>
          </label>
          <select
            id="companyId"
            name="companyId"
            value={project.companyId || ''}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
              validationErrors.companyId ? 'border-red-300' : 'border-gray-300'
            } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
          >
            <option value="">-- Select a Company --</option>
            {companies.map(comp => (
              <option key={comp.id} value={comp.id}>
                {comp.name}
              </option>
            ))}
          </select>
          {validationErrors.companyId && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.companyId}</p>
          )}
        </div>

        {/* Project Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={project.name}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
              validationErrors.name ? 'border-red-300' : 'border-gray-300'
            } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
          />
          {validationErrors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.name}</p>
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
            value={project.description || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Daily Rate */}
          <div>
            <label htmlFor="dailyRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Daily Rate <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="dailyRate"
              id="dailyRate"
              step="0.01"
              value={project.dailyRate || ''}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                validationErrors.dailyRate ? 'border-red-300' : 'border-gray-300'
              } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
            />
            {validationErrors.dailyRate && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.dailyRate}</p>
            )}
          </div>

          {/* Hourly Rate */}
          <div>
            <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Hourly Rate <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="hourlyRate"
              id="hourlyRate"
              step="0.01"
              value={project.hourlyRate || ''}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                validationErrors.hourlyRate ? 'border-red-300' : 'border-gray-300'
              } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
            />
            {validationErrors.hourlyRate && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.hourlyRate}</p>
            )}
          </div>

          {/* Currency */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Currency <span className="text-red-500">*</span>
            </label>
            <select
              name="currency"
              id="currency"
              value={project.currency || 'EUR'}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                validationErrors.currency ? 'border-red-300' : 'border-gray-300'
              } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
            {validationErrors.currency && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.currency}</p>
            )}
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
              value={project.startDate ? project.startDate.split('T')[0] : ''} // Format for date input
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
              value={project.endDate ? project.endDate.split('T')[0] : ''} // Format for date input
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                validationErrors.endDate ? 'border-red-300' : 'border-gray-300'
              } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
            />
            {validationErrors.endDate && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.endDate}</p>
            )}
          </div>

          {/* Estimated Hours */}
          <div>
            <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Estimated Hours
            </label>
            <input
              type="number"
              name="estimatedHours"
              id="estimatedHours"
              step="1"
              value={project.estimatedHours || ''}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                validationErrors.estimatedHours ? 'border-red-300' : 'border-gray-300'
              } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
            />
            {validationErrors.estimatedHours && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.estimatedHours}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              name="status"
              value={project.status}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                validationErrors.status ? 'border-red-300' : 'border-gray-300'
              } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
            >
              {Object.values(ProjectStatus).map(status => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            {validationErrors.status && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.status}</p>
            )}
          </div>

          {/* Default Client */}
          <div>
            <label htmlFor="defaultClientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Default Client for New Tasks
            </label>
            <select
              id="defaultClientId"
              name="defaultClientId"
              value={project.defaultClientId || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              disabled={!isEditMode || clients.length === 0}
            >
              <option value="">-- No default client --</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {!isEditMode
                ? 'Save the project first, then add clients to set a default.'
                : 'This client will be pre-selected when creating a new task for this project.'}
            </p>
          </div>

        </div>

        {/* Clients Section - Only show in edit mode */}
        {isEditMode && projectId && (
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Clients</h3>
              <button
                type="button"
                onClick={handleNewClient}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors text-sm"
              >
                Add Client
              </button>
            </div>
            {clients.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                No clients found. Add your first client!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project Manager</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {clients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {client.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-300">
                            {client.projectManagerName || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-500 dark:text-gray-300">
                            {client.description || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-300">
                            {client.contactEmail && <div>{client.contactEmail}</div>}
                            {client.contactPhone && <div>{client.contactPhone}</div>}
                            {!client.contactEmail && !client.contactPhone && '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => handleEditClient(client)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
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
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(companyId ? `/companies/${companyId}` : '/projects')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : (isEditMode ? 'Update Project' : 'Create Project')}
          </button>
        </div>
      </form>

      {/* Delete Client Confirmation Modal - Outside the form */}
      {deleteClientModalOpen && clientToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
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
                  type="button"
                  onClick={closeDeleteClientModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
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

      {/* Client Form Modal - Outside the form */}
      {showClientForm && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50"
          onClick={(e) => {
            // Close modal if clicking on backdrop
            if (e.target === e.currentTarget) {
              handleCancelClientForm();
            }
          }}
        >
          <div 
            className="relative p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800 m-4"
            onClick={(e) => e.stopPropagation()} // Prevent backdrop click from closing
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h3>
            {saveError && saveError.includes('client') && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{saveError}</span>
              </div>
            )}
            <form onSubmit={handleClientFormSubmit} className="space-y-4" noValidate>
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
    </div>
  );
};

export default ProjectFormPage; 
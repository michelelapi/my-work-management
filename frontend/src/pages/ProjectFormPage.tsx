import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project, ProjectStatus } from '../types/project';
import { Company } from '../types/company'; // Import Company type for company selection
import projectService from '../services/projectService';
import companyService from '../services/companyService'; // Import company service for fetching companies

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

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
          const fetchedProject = await projectService.getProjectById(parseInt(companyId, 10), parseInt(projectId, 10));
          setProject(fetchedProject);
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
      [name]: name === 'companyId' || name === 'estimatedHours' || name === 'dailyRate' || name === 'hourlyRate' ? (value ? Number(value) : undefined) : value,
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

    setSaveError(null);
    setIsSaving(true);

    try {
      if (isEditMode && projectId) {
        await projectService.updateProject(project.companyId, parseInt(projectId, 10), project);
      } else {
        await projectService.createProject(project.companyId, project);
      }
      navigate(`/companies/${project.companyId}`); // Redirect to company detail page after saving
    } catch (err) {
      console.error('Error saving project:', err);
      setSaveError(`Failed to save project: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
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
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        {isEditMode ? 'Edit Project' : 'Create New Project'}
      </h1>

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

        </div>

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
    </div>
  );
};

export default ProjectFormPage; 
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project, ProjectStatus } from '../types/project';
import { Company } from '../types/company'; // Import Company type for company selection
import projectService from '../services/projectService';
import companyService from '../services/companyService'; // Import company service for fetching companies

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProject(prev => ({
      ...prev,
      [name]: name === 'companyId' || name === 'estimatedHours' ? parseInt(value, 10) : value,
      status: name === 'status' ? (value as ProjectStatus) : prev.status, // Handle enum conversion
      // Special handling for date inputs
      startDate: name === 'startDate' ? value : prev.startDate,
      endDate: name === 'endDate' ? value : prev.endDate,
      dailyRate: name === 'dailyRate' ? (value ? parseFloat(value) : undefined) : prev.dailyRate,
      hourlyRate: name === 'hourlyRate' ? (value ? parseFloat(value) : undefined) : prev.hourlyRate,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project.companyId) {
      setSaveError('Please select a company');
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

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
        {/* Company Selection - only if not coming from a company page */}
        {!companyId && (
          <div>
            <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Company
            </label>
            <select
              id="companyId"
              name="companyId"
              required
              value={project.companyId || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            >
              <option value="">-- Select a Company --</option>
              {companies.map(comp => (
                <option key={comp.id} value={comp.id}>
                  {comp.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Project Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Project Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            required
            value={project.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
          />
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
              Daily Rate
            </label>
            <input
              type="number"
              name="dailyRate"
              id="dailyRate"
              step="0.01"
              value={project.dailyRate || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>

          {/* Hourly Rate */}
          <div>
            <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Hourly Rate
            </label>
            <input
              type="number"
              name="hourlyRate"
              id="hourlyRate"
              step="0.01"
              value={project.hourlyRate || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>

          {/* Currency */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Currency
            </label>
            <input
              type="text"
              name="currency"
              id="currency"
              maxLength={3}
              value={project.currency || 'EUR'}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              id="startDate"
              value={project.startDate ? project.startDate.split('T')[0] : ''} // Format for date input
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              id="status"
              name="status"
              required
              value={project.status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            >
              {Object.values(ProjectStatus).map(status => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
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
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Company } from '../types/company';
import { CompanyContact } from '../types/companyContact';
import { Project, ProjectStatus } from '../types/project';
import companyService from '../services/companyService';
import projectService from '../services/projectService';
import { FaPen } from "@react-icons/all-files/fa/FaPen"
import { FaTrash } from "@react-icons/all-files/fa/FaTrash"

interface CompanySectionsState {
  isProjectsExpanded: boolean;
  isContactsExpanded: boolean;
}


const CompanyDetailsPage: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  const [isContactsExpanded, setIsContactsExpanded] = useState(true);
  const [deleteContactModalOpen, setDeleteContactModalOpen] = useState(false);
  const [deleteProjectModalOpen, setDeleteProjectModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<CompanyContact | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Load sections state from localStorage
  useEffect(() => {
    if (companyId) {
      const savedState = localStorage.getItem(`company-sections-${companyId}`);
      if (savedState) {
        const { isProjectsExpanded, isContactsExpanded } = JSON.parse(savedState) as CompanySectionsState;
        setIsProjectsExpanded(isProjectsExpanded);
        setIsContactsExpanded(isContactsExpanded);
      }
    }
  }, [companyId]);

  // Save sections state to localStorage
  const saveSectionsState = (projectsExpanded: boolean, contactsExpanded: boolean) => {
    if (companyId) {
      const state: CompanySectionsState = {
        isProjectsExpanded: projectsExpanded,
        isContactsExpanded: contactsExpanded,
      };
      localStorage.setItem(`company-sections-${companyId}`, JSON.stringify(state));
    }
  };

  // Update projects expanded state
  const handleProjectsToggle = (expanded: boolean) => {
    setIsProjectsExpanded(expanded);
    saveSectionsState(expanded, isContactsExpanded);
  };

  // Update contacts expanded state
  const handleContactsToggle = (expanded: boolean) => {
    setIsContactsExpanded(expanded);
    saveSectionsState(isProjectsExpanded, expanded);
  };

  useEffect(() => {
    if (!companyId) return;
    const id = parseInt(companyId, 10);
    if (isNaN(id)) {
      setError('Invalid company ID');
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [companyData, contactsData, projectsData] = await Promise.all([
          companyService.getCompanyById(id),
          companyService.getCompanyContacts(id),
          projectService.getAllProjectsByCompanyId(id)
        ]);
        setCompany(companyData);
        setContacts(contactsData);
        setProjects(projectsData);
      } catch (err) {
        console.error('Error fetching company details:', err);
        setError('Failed to load company details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  const handleDeleteContact = async (contactId: number) => {
    if (!companyId) return;

    try {
      await companyService.deleteCompanyContact(parseInt(companyId, 10), contactId);
      setContacts(contacts.filter(contact => contact.id !== contactId));
      setDeleteContactModalOpen(false);
      setContactToDelete(null);
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError('Failed to delete contact');
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!companyId) return;

    try {
      await projectService.deleteProject(parseInt(companyId, 10), projectId);
      setProjects(projects.filter(project => project.id !== projectId));
      setDeleteProjectModalOpen(false);
      setProjectToDelete(null);
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
    }
  };

  const openDeleteContactModal = (contact: CompanyContact) => {
    setContactToDelete(contact);
    setDeleteContactModalOpen(true);
  };

  const closeDeleteContactModal = () => {
    setDeleteContactModalOpen(false);
    setContactToDelete(null);
  };

  const openDeleteProjectModal = (project: Project) => {
    setProjectToDelete(project);
    setDeleteProjectModalOpen(true);
  };

  const closeDeleteProjectModal = () => {
    setDeleteProjectModalOpen(false);
    setProjectToDelete(null);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error || !company) {
    return <div className="text-red-500 text-center min-h-screen">{error || 'Company not found'}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Delete Contact Confirmation Modal */}
      {deleteContactModalOpen && contactToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                <svg className="h-6 w-6 text-red-600 dark:text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-2">Delete Contact</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete the contact "{contactToDelete.name}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={closeDeleteContactModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteContact(contactToDelete.id!)}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {deleteProjectModalOpen && projectToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                <svg className="h-6 w-6 text-red-600 dark:text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-2">Delete Project</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete the project "{projectToDelete.name}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={closeDeleteProjectModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProject(projectToDelete.id!)}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Details Section */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{company.description}</p>
          </div>
          <button
            onClick={() => navigate(`/companies/${company.id}/edit`)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Edit Company
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Information</h3>
            <p className="mt-1 text-gray-900 dark:text-white">{company.email}</p>
            <p className="mt-1 text-gray-900 dark:text-white">{company.phone}</p>
            <p className="mt-1 text-gray-900 dark:text-white">{company.address}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Additional Information</h3>
            <p className="mt-1 text-gray-900 dark:text-white">Website: {company.website}</p>
            <p className="mt-1 text-gray-900 dark:text-white">Tax ID: {company.taxId}</p>
            <p className="mt-1 text-gray-900 dark:text-white">Payment Terms: {company.paymentTerms} days</p>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <button
              onClick={() => handleProjectsToggle(!isProjectsExpanded)}
              className="mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg
                className={`w-5 h-5 transform transition-transform ${isProjectsExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Projects</h2>
          </div>
          <button
            onClick={() => navigate(`/companies/${company.id}/projects/new`)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Create New Project
          </button>
        </div>

        {isProjectsExpanded && (
          <>
            {projects.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-4">
                No projects found. Create your first project!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Start Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">End Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Daily Rate</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {projects.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {project.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            project.status === ProjectStatus.ACTIVE
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : project.status === ProjectStatus.COMPLETED
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-300">
                            {project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-300">
                            {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-300">
                            {project.dailyRate ? 
                              `${project.currency === 'EUR' ? '€' : '$'}${project.dailyRate}` : 
                              '-'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => navigate(`/companies/${company.id}/projects/${project.id}/edit`)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                            title="Edit"
                          >
                            <FaPen size={16} className="inline-block" />
                          </button>
                          <button
                            onClick={() => openDeleteProjectModal(project)}
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
          </>
        )}
      </div>

      {/* Contacts Section */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <button
              onClick={() => handleContactsToggle(!isContactsExpanded)}
              className="mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg
                className={`w-5 h-5 transform transition-transform ${isContactsExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Contacts</h2>
          </div>
          <button
            onClick={() => navigate(`/companies/${company.id}/contacts/new`)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Add Contact
          </button>
        </div>

        {isContactsExpanded && (
          <>
            {contacts.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-4">
                No contacts found. Add your first contact!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Position</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Primary</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {contacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {contact.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-300">{contact.role}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-300">{contact.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-300">{contact.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            contact.isPrimary
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {contact.isPrimary ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => navigate(`/companies/${company.id}/contacts/${contact.id}/edit`)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                            title="Edit"
                          >
                            <FaPen size={16} className="inline-block" />
                          </button>
                          <button
                            onClick={() => openDeleteContactModal(contact)}
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
          </>
        )}
      </div>
    </div>
  );
};

export default CompanyDetailsPage; 
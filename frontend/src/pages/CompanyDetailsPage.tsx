import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Company } from '../types/company';
import { CompanyContact } from '../types/companyContact';
import companyService from '../services/companyService';

const CompanyDetailsPage: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const [companyData, contactsData] = await Promise.all([
          companyService.getCompanyById(id),
          companyService.getCompanyContacts(id)
        ]);
        setCompany(companyData);
        setContacts(contactsData);
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
    if (!companyId || !window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      await companyService.deleteCompanyContact(parseInt(companyId, 10), contactId);
      setContacts(contacts.filter(contact => contact.id !== contactId));
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError('Failed to delete contact');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error || !company) {
    return <div className="text-red-500 text-center min-h-screen">{error || 'Company not found'}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Company Details Section */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{company.name}</h1>
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

      {/* Contacts Section */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Contacts</h2>
          <button
            onClick={() => navigate(`/companies/${company.id}/contacts/new`)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Add Contact
          </button>
        </div>

        {/* Projects Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Projects</h2>
          <button
            onClick={() => navigate(`/companies/${company.id}/projects/new`)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Create New Project
          </button>
        </div>

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
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id!)}
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
    </div>
  );
};

export default CompanyDetailsPage; 
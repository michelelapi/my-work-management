import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Company } from '../types/company';
import companyService from '../services/companyService';

const CompanyFormPage: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company>({ name: '' }); // Initialize with required fields
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isEditMode = !!companyId;

  useEffect(() => {
    if (!isEditMode) {
      setIsLoading(false);
      return;
    }

    const id = parseInt(companyId, 10);
    if (isNaN(id)) {
      setError('Invalid Company ID.');
      setIsLoading(false);
      return;
    }

    const fetchCompany = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await companyService.getCompanyById(id);
        setCompany(data);
      } catch (err) {
        console.error('Error fetching company for edit:', err);
        setError('Failed to load company data for editing.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompany();
  }, [companyId, isEditMode]); // Refetch when companyId changes or mode changes

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCompany(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setIsSaving(true);

    try {
      const savedCompany = await companyService.saveCompany(company);
      navigate(`/companies/${savedCompany.id}`); // Navigate to the details page after saving
    } catch (err) {
      console.error('Error saving company:', err);
      setSaveError(`Failed to save company: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
    <div className="container mx-auto p-4 dark:text-white">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{isEditMode ? 'Edit Company' : 'Create Company'}</h1>

      {saveError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
        {/* Company Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
          <input
            type="text"
            name="name"
            id="name"
            required
            value={company.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            name="description"
            id="description"
            value={company.description || ''}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
          ></textarea>
        </div>

        {/* Contact Person */}
         <div>
          <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Person</label>
          <input
            type="text"
            name="contactPerson"
            id="contactPerson"
            value={company.contactPerson || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            value={company.email || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
          />
        </div>

         {/* Phone */}
         <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
          <input
            type="text"
            name="phone"
            id="phone"
            value={company.phone || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
          />
        </div>

        {/* Address */}
         <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
          <input
            type="text"
            name="address"
            id="address"
            value={company.address || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
          />
        </div>

        {/* Website */}
         <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Website</label>
          <input
            type="text"
            name="website"
            id="website"
            value={company.website || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
          />
        </div>

        {/* Tax ID */}
         <div>
          <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tax ID</label>
          <input
            type="text"
            name="taxId"
            id="taxId"
            value={company.taxId || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
          />
        </div>

         {/* Payment Terms */}
         <div>
          <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Terms</label>
          <input
            type="number"
            name="paymentTerms"
            id="paymentTerms"
            value={company.paymentTerms || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
          />
        </div>

         {/* Status - Assuming a dropdown or similar for CompanyStatus */}
         {/* You might need to fetch CompanyStatus options from backend if needed */}
         <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
             <select
                id="status"
                name="status"
                value={company.status || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            >
                <option value="">Select Status</option>
                {/* Add options dynamically based on your CompanyStatus enum/values */}    
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING">Pending</option>
            </select>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : (isEditMode ? 'Update Company' : 'Create Company')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyFormPage; 
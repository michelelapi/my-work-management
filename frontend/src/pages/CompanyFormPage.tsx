import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Company } from '../types/company';
import companyService from '../services/companyService';

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  taxId?: string;
  paymentTerms?: string;
}

const CompanyFormPage: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company>({ name: '' }); // Initialize with required fields
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  const validateField = (name: string, value: string | number | undefined): string | undefined => {
    switch (name) {
      case 'name':
        if (!value) return 'Company name is required';
        if (typeof value === 'string' && value.length < 2) return 'Company name must be at least 2 characters';
        break;
      case 'email':
        if (!value) return 'Email is required';
        if (typeof value === 'string') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) return 'Please enter a valid email address';
        }
        break;
      case 'phone':
        if (value) {
          const phoneRegex = /^\+?[\d\s-()]{8,}$/;
          if (typeof value === 'string' && !phoneRegex.test(value)) {
            return 'Please enter a valid phone number';
          }
        }
        break;
      case 'website':
        if (value) {
          const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
          if (typeof value === 'string' && !urlRegex.test(value)) {
            return 'Please enter a valid website URL';
          }
        }
        break;
      case 'taxId':
        if (value) {
          if (typeof value === 'string' && value.length < 3) {
            return 'Tax ID must be at least 3 characters';
          }
        }
        break;
      case 'paymentTerms':
        if (value) {
          const numValue = Number(value);
          if (isNaN(numValue) || numValue < 0) {
            return 'Payment terms must be a positive number';
          }
        }
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Validate all fields at once
    Object.keys(company).forEach((field) => {
      const error = validateField(field, company[field as keyof Company]);
      if (error) {
        errors[field as keyof ValidationErrors] = error;
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCompany(prev => ({
      ...prev,
      [name]: value,
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
      const savedCompany = await companyService.saveCompany(company);
      navigate(`/companies/${savedCompany.id}`);
    } catch (err) {
      console.error('Error saving company:', err);
      setSaveError(`Failed to save company: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
      setShowConfirmModal(false);
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
                {isEditMode ? 'Update Company' : 'Create Company'}
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to {isEditMode ? 'update' : 'create'} this company?
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
        {/* Company Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={company.name}
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
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="email"
            id="email"
            value={company.email || ''}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
              validationErrors.email ? 'border-red-300' : 'border-gray-300'
            } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
          />
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.email}</p>
          )}
        </div>

         {/* Phone */}
         <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Phone
          </label>
          <input
            type="text"
            name="phone"
            id="phone"
            value={company.phone || ''}
            onChange={handleChange}
            placeholder="+1 (555) 555-5555"
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
              validationErrors.phone ? 'border-red-300' : 'border-gray-300'
            } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
          />
          {validationErrors.phone && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.phone}</p>
          )}
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
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Website
          </label>
          <input
            type="text"
            name="website"
            id="website"
            value={company.website || ''}
            onChange={handleChange}
            placeholder="https://example.com"
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
              validationErrors.website ? 'border-red-300' : 'border-gray-300'
            } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
          />
          {validationErrors.website && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.website}</p>
          )}
        </div>

        {/* Tax ID */}
        <div>
          <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tax ID
          </label>
          <input
            type="text"
            name="taxId"
            id="taxId"
            value={company.taxId || ''}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
              validationErrors.taxId ? 'border-red-300' : 'border-gray-300'
            } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
          />
          {validationErrors.taxId && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.taxId}</p>
          )}
        </div>

         {/* Payment Terms */}
         <div>
          <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Payment Terms (days)
          </label>
          <input
            type="number"
            name="paymentTerms"
            id="paymentTerms"
            min="0"
            value={company.paymentTerms || ''}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
              validationErrors.paymentTerms ? 'border-red-300' : 'border-gray-300'
            } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
          />
          {validationErrors.paymentTerms && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.paymentTerms}</p>
          )}
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
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/companies')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : (isEditMode ? 'Update Company' : 'Create Company')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyFormPage; 
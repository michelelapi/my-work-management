import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CompanyContact } from '../types/companyContact';
import companyService from '../services/companyService';

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

const CompanyContactFormPage: React.FC = () => {
  const { companyId, contactId } = useParams<{ companyId: string; contactId: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<CompanyContact>({
    name: '',
    email: '',
    isPrimary: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const isEditMode = !!contactId;

  useEffect(() => {
    if (!isEditMode || !companyId || !contactId) {
      setIsLoading(false);
      return;
    }

    const fetchContact = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const contactData = await companyService.getCompanyContactById(parseInt(companyId, 10), parseInt(contactId, 10));
        if (contactData) {
          setContact(contactData);
        } else {
          setError('Contact not found');
        }
      } catch (err) {
        console.error('Error fetching contact:', err);
        setError('Failed to load contact data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContact();
  }, [companyId, contactId, isEditMode]);

  const validateField = (name: string, value: string | undefined): string | undefined => {
    switch (name) {
      case 'name':
        if (!value) return 'Contact name is required';
        if (value.length < 2) return 'Contact name must be at least 2 characters';
        break;
      case 'email':
        if (!value) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        break;
      case 'phone':
        if (!value) return 'Phone number is required';
        if (value) {
          const phoneRegex = /^\+?[\d\s-()]{8,}$/;
          if (!phoneRegex.test(value)) {
            return 'Please enter a valid phone number';
          }
        }
        break;
      case 'role':
        // No specific validation rule needed as it's optional.
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Validate only fields that are explicitly in ValidationErrors and are strings
    const fieldsToValidate: Array<keyof ValidationErrors> = ['name', 'email', 'phone', 'role'];

    fieldsToValidate.forEach((field) => {
      // Ensure we only pass string or undefined to validateField
      const value = typeof contact[field] === 'string' ? contact[field] : undefined;
      const error = validateField(field, value);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setContact(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    if (!validateForm()) {
      return;
    }

    setSaveError(null);
    setIsSaving(true);

    try {
      await companyService.saveCompanyContact(parseInt(companyId, 10), contact);
      navigate(`/companies/${companyId}`);
    } catch (err) {
      console.error('Error saving contact:', err);
      setSaveError(`Failed to save contact: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center min-h-screen">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {saveError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={contact.name}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                validationErrors.name ? 'border-red-300' : 'border-gray-300'
              } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
            />
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.name}</p>
            )}
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
              value={contact.email}
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
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="phone"
              id="phone"
              value={contact.phone || ''}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                validationErrors.phone ? 'border-red-300' : 'border-gray-300'
              } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
            />
            {validationErrors.phone && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.phone}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Role
            </label>
            <input
              type="text"
              name="role"
              id="role"
              value={contact.role || ''}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                validationErrors.role ? 'border-red-300' : 'border-gray-300'
              } dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
            />
            {validationErrors.role && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.role}</p>
            )}
          </div>
        </div>

        {/* Is Primary */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isPrimary"
            id="isPrimary"
            checked={contact.isPrimary}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="isPrimary" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Primary Contact
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(`/companies/${companyId}`)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : (isEditMode ? 'Update Contact' : 'Create Contact')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyContactFormPage; 
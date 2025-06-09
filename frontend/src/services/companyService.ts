import axios from 'axios';
import { Company, CompanyContact } from '../types/company';
import { CompanyContact as CompanyContactType } from '../types/companyContact';
import api from './api';

const companyService = {
  // Fetch all companies
  async getAllCompanies(): Promise<Company[]> {
    const response = await api.get('/companies');
    console.log('Raw API Response:', response);
    console.log('Response Data:', response.data);
    // If the response is wrapped in a data property, extract it
    return Array.isArray(response.data.content) ? response.data.content : response.data.data || [];
  },

  // Fetch a company by ID
  async getCompanyById(companyId: number): Promise<Company> {
    const response = await api.get(`/companies/${companyId}`);
    return response.data;
  },

  // Fetch all contacts for a company
  async getCompanyContacts(companyId: number): Promise<CompanyContactType[]> {
    const response = await api.get(`/companies/${companyId}/contacts`);
    return response.data.content;
  },

  // Fetch a single contact by ID for a company
  async getCompanyContactById(companyId: number, contactId: number): Promise<CompanyContactType> {
    const response = await api.get(`/companies/${companyId}/contacts/${contactId}`);
    return response.data;
  },

  // Create or update a company
  async saveCompany(company: Company): Promise<Company> {
    if (company.id) {
      const response = await api.put(`/companies/${company.id}`, company);
      return response.data;
    } else {
      const response = await api.post('/companies', company);
      return response.data;
    }
  },

  // Create or update a company contact
  async saveCompanyContact(companyId: number, contact: CompanyContactType): Promise<CompanyContactType> {
    if (contact.id) {
      const response = await api.put(`/companies/${companyId}/contacts/${contact.id}`, contact);
      return response.data;
    } else {
      const response = await api.post(`/companies/${companyId}/contacts`, contact);
      return response.data;
    }
  },

  // Delete a company
  async deleteCompany(companyId: number): Promise<void> {
    await api.delete(`/companies/${companyId}`);
  },

  // Delete a company contact
  async deleteCompanyContact(companyId: number, contactId: number): Promise<void> {
    await api.delete(`/companies/${companyId}/contacts/${contactId}`);
  }
};

export default companyService; 
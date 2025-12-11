package com.myworkmanagement.company.service;

import com.myworkmanagement.company.dto.CompanyDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CompanyService {
    Page<CompanyDTO> getAllCompaniesByUserEmail(String userEmail, Pageable pageable);
    
    CompanyDTO getCompanyById(Long id);
    
    CompanyDTO createCompany(CompanyDTO companyDTO);
    
    CompanyDTO updateCompany(Long id, CompanyDTO companyDTO);
    
    void deleteCompany(Long id);
    
    // Not used in CompanyController - only used internally for validation
    // boolean existsByName(String name);
    
    // Not used in CompanyController - only used internally for validation
    // boolean existsByEmail(String email);
    
    // Not used in CompanyController - only used internally for validation
    // boolean existsByTaxId(String taxId);
} 
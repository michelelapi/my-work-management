package com.myworkmanagement.company.service;

import com.myworkmanagement.company.dto.CompanyDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CompanyService {
    Page<CompanyDTO> getAllCompanies(Pageable pageable);
    
    CompanyDTO getCompanyById(Long id);
    
    CompanyDTO createCompany(CompanyDTO companyDTO);
    
    CompanyDTO updateCompany(Long id, CompanyDTO companyDTO);
    
    void deleteCompany(Long id);
    
    Page<CompanyDTO> searchCompanies(String searchTerm, Pageable pageable);
    
    boolean existsByName(String name);
    
    boolean existsByEmail(String email);
    
    boolean existsByTaxId(String taxId);
} 
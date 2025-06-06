package com.myworkmanagement.company.service;

import com.myworkmanagement.company.dto.CompanyContactDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CompanyContactService {
    Page<CompanyContactDTO> getCompanyContacts(Long companyId, Pageable pageable);
    
    CompanyContactDTO getCompanyContactById(Long companyId, Long contactId);
    
    CompanyContactDTO createCompanyContact(Long companyId, CompanyContactDTO contactDTO);
    
    CompanyContactDTO updateCompanyContact(Long companyId, Long contactId, CompanyContactDTO contactDTO);
    
    void deleteCompanyContact(Long companyId, Long contactId);
    
    Page<CompanyContactDTO> searchContacts(Long companyId, String searchTerm, Pageable pageable);
    
    CompanyContactDTO getPrimaryContact(Long companyId);
    
    boolean existsPrimaryContact(Long companyId);
} 
package com.myworkmanagement.company.repository;

import com.myworkmanagement.company.entity.CompanyContact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CompanyContactRepository extends JpaRepository<CompanyContact, Long> {
    
    Page<CompanyContact> findByCompanyId(Long companyId, Pageable pageable);
    
    boolean existsByCompanyIdAndIsPrimaryTrue(Long companyId);
} 
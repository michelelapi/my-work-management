package com.myworkmanagement.company.repository;

import com.myworkmanagement.company.entity.Company;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {
    
    Optional<Company> findByName(String name);
    
    Optional<Company> findByEmail(String email);
    
    Optional<Company> findByTaxId(String taxId);
    
    boolean existsByName(String name);
    
    boolean existsByEmail(String email);
    
    boolean existsByTaxId(String taxId);

    Page<Company> findAllByUserEmail(String userEmail, Pageable pageable);
} 
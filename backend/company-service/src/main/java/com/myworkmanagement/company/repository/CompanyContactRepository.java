package com.myworkmanagement.company.repository;

import com.myworkmanagement.company.entity.CompanyContact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyContactRepository extends JpaRepository<CompanyContact, Long> {
    
    Page<CompanyContact> findByCompanyId(Long companyId, Pageable pageable);
    
    Optional<CompanyContact> findByCompanyIdAndIsPrimaryTrue(Long companyId);
    
    @Query("SELECT cc FROM CompanyContact cc WHERE cc.company.id = :companyId AND " +
           "(LOWER(cc.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(cc.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<CompanyContact> searchContacts(@Param("companyId") Long companyId, 
                                      @Param("searchTerm") String searchTerm, 
                                      Pageable pageable);
    
    boolean existsByCompanyIdAndIsPrimaryTrue(Long companyId);
} 
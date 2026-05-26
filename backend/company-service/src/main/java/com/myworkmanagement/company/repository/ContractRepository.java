package com.myworkmanagement.company.repository;

import com.myworkmanagement.company.entity.Contract;
import com.myworkmanagement.company.entity.ContractStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    Page<Contract> findByUserEmail(String userEmail, Pageable pageable);

    List<Contract> findByCompanyIdAndUserEmail(Long companyId, String userEmail);

    Optional<Contract> findByIdAndUserEmail(Long id, String userEmail);

    List<Contract> findByStatusAndUserEmail(ContractStatus status, String userEmail);

    Optional<Contract> findByCode(String code);

    @Query("SELECT c FROM Contract c JOIN c.projects p WHERE p.id = :projectId ORDER BY c.startDate ASC, c.id ASC")
    List<Contract> findByProjectId(@Param("projectId") Long projectId);

    @Query("SELECT c FROM Contract c JOIN c.projects p WHERE p.id = :projectId AND c.status = :status ORDER BY c.startDate ASC, c.id ASC")
    List<Contract> findByProjectIdAndStatus(@Param("projectId") Long projectId, @Param("status") ContractStatus status);
}

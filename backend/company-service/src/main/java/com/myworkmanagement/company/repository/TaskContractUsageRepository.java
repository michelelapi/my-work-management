package com.myworkmanagement.company.repository;

import com.myworkmanagement.company.entity.TaskContractUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface TaskContractUsageRepository extends JpaRepository<TaskContractUsage, Long> {

    List<TaskContractUsage> findByTaskId(Long taskId);

    List<TaskContractUsage> findByTaskIdOrderByIdAsc(Long taskId);

    List<TaskContractUsage> findByContractId(Long contractId);

    @Modifying
    @Query("UPDATE TaskContractUsage t SET t.contractCode = :newCode WHERE t.contract.id = :contractId")
    void updateContractCodeByContractId(@Param("contractId") Long contractId, @Param("newCode") String newCode);

    @Modifying
    void deleteByTaskId(Long taskId);

    @Query("SELECT COALESCE(SUM(u.amountUsed), 0) " +
        "FROM TaskContractUsage u " +
        "JOIN u.task t " +
        "JOIN t.project p " +
        "WHERE p.company.id = :companyId " +
        "AND t.userEmail = :userEmail " +
        "AND (u.invoiceId IS NULL OR TRIM(u.invoiceId) = '')")
    BigDecimal sumUnbilledUsageAmountByCompanyIdAndUserEmail(@Param("companyId") Long companyId, @Param("userEmail") String userEmail);

    @Query("SELECT COALESCE(SUM(u.amountUsed), 0) " +
        "FROM TaskContractUsage u " +
        "JOIN u.task t " +
        "JOIN t.project p " +
        "WHERE p.company.id = :companyId " +
        "AND t.userEmail = :userEmail " +
        "AND u.invoiceId IS NOT NULL " +
        "AND TRIM(u.invoiceId) <> '' " +
        "AND u.paymentDate IS NULL")
    BigDecimal sumBilledUnpaidUsageAmountByCompanyIdAndUserEmail(@Param("companyId") Long companyId, @Param("userEmail") String userEmail);
}

package com.myworkmanagement.company.repository;

import com.myworkmanagement.company.entity.TaskContractUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

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
}

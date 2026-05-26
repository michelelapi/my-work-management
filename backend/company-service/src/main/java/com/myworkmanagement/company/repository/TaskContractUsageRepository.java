package com.myworkmanagement.company.repository;

import com.myworkmanagement.company.entity.TaskContractUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskContractUsageRepository extends JpaRepository<TaskContractUsage, Long> {

    List<TaskContractUsage> findByTaskId(Long taskId);

    List<TaskContractUsage> findByContractId(Long contractId);

    @Modifying
    void deleteByTaskId(Long taskId);
}

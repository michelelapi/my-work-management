package com.myworkmanagement.company.repository;

import com.myworkmanagement.company.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    
    List<Client> findByProjectId(Long projectId);
    
    Optional<Client> findByIdAndProjectId(Long id, Long projectId);
    
    boolean existsByProjectIdAndName(Long projectId, String name);
}

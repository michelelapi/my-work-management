package com.myworkmanagement.company.repository;

import com.myworkmanagement.company.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Page<Project> findByCompanyId(Long companyId, Pageable pageable);
    Optional<Project> findByCompanyIdAndId(Long companyId, Long id);
    boolean existsByCompanyIdAndName(Long companyId, String name);
    Page<Project> findAllByUserEmail(String userEmail, Pageable pageable);
    List<Project> findAllByUserEmail(String userEmail);
    Long countByCompanyId(Long companyId);
    Page<Project> findByCompanyIdAndNameContainingOrDescriptionContaining(Long companyId, String name, String description, Pageable pageable);
    Optional<Project> findByCompanyIdAndName(Long companyId, String name);
} 
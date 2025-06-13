package com.myworkmanagement.company.service;

import com.myworkmanagement.company.dto.ProjectDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProjectService {
    Page<ProjectDTO> getAllProjectsByCompanyId(Long companyId, Pageable pageable);
    Page<ProjectDTO> getAllProjectsByUserEmail(String userEmail, Pageable pageable);
    ProjectDTO getProjectById(Long companyId, Long projectId);
    ProjectDTO createProject(Long companyId, ProjectDTO projectDTO);
    ProjectDTO updateProject(Long companyId, Long projectId, ProjectDTO projectDTO);
    void deleteProject(Long companyId, Long projectId);
    Page<ProjectDTO> searchProjects(Long companyId, String searchTerm, Pageable pageable);
    ProjectDTO getProjectByName(Long companyId, String projectName);
} 
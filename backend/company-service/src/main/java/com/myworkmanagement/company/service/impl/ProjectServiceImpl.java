package com.myworkmanagement.company.service.impl;

import com.myworkmanagement.company.dto.ProjectDTO;
import com.myworkmanagement.company.entity.Company;
import com.myworkmanagement.company.entity.Project;
import com.myworkmanagement.company.exception.ResourceNotFoundException;
import com.myworkmanagement.company.repository.CompanyRepository;
import com.myworkmanagement.company.repository.ProjectRepository;
import com.myworkmanagement.company.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<ProjectDTO> getAllProjectsByCompanyId(Long companyId, Pageable pageable) {
        if (!companyRepository.existsById(companyId)) {
            throw new ResourceNotFoundException("Company not found with id: " + companyId);
        }
        return projectRepository.findByCompanyId(companyId, pageable)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProjectDTO> getAllProjectsByUserEmail(String userEmail, Pageable pageable) {
        return projectRepository.findAllByUserEmail(userEmail, pageable)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectDTO getProjectById(Long companyId, Long projectId) {
        return projectRepository.findByCompanyIdAndId(companyId, projectId)
                .map(this::mapToDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId + " for company: " + companyId));
    }

    @Override
    public ProjectDTO createProject(Long companyId, ProjectDTO projectDTO) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));

        if (projectRepository.existsByCompanyIdAndName(companyId, projectDTO.getName())) {
            throw new IllegalArgumentException("Project with name \"" + projectDTO.getName() + "\" already exists for this company.");
        }

        Project project = mapToEntity(projectDTO);
        project.setCompany(company);
        project.setUserEmail(projectDTO.getUserEmail());
        return mapToDTO(projectRepository.save(project));
    }

    @Override
    public ProjectDTO updateProject(Long companyId, Long projectId, ProjectDTO projectDTO) {
        Project existingProject = projectRepository.findByCompanyIdAndId(companyId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId + " for company: " + companyId));

        if (projectDTO.getName() != null && !existingProject.getName().equals(projectDTO.getName()) && projectRepository.existsByCompanyIdAndName(companyId, projectDTO.getName())) {
            throw new IllegalArgumentException("Project with name \"" + projectDTO.getName() + "\" already exists for this company.");
        }

        updateProjectFromDTO(existingProject, projectDTO);
        return mapToDTO(projectRepository.save(existingProject));
    }

    @Override
    public void deleteProject(Long companyId, Long projectId) {
        if (!this.existsByCompanyIdAndId(companyId, projectId)) {
            throw new ResourceNotFoundException("Project not found with id: " + projectId + " for company: " + companyId);
        }
        projectRepository.deleteById(projectId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProjectDTO> searchProjects(Long companyId, String searchTerm, Pageable pageable) {
        // This method assumes a search method in ProjectRepository. You might need to implement this.
        // For now, it will return all projects for the company.
        if (!companyRepository.existsById(companyId)) {
            throw new ResourceNotFoundException("Company not found with id: " + companyId);
        }
        return projectRepository.findByCompanyId(companyId, pageable)
                .map(this::mapToDTO);
    }

    private ProjectDTO mapToDTO(Project project) {
        return ProjectDTO.builder()
                .id(project.getId())
                .companyId(project.getCompany().getId())
                .name(project.getName())
                .description(project.getDescription())
                .dailyRate(project.getDailyRate())
                .hourlyRate(project.getHourlyRate())
                .currency(project.getCurrency())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .estimatedHours(project.getEstimatedHours())
                .status(project.getStatus())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .companyName(project.getCompany().getName())
                .build();
    }

    private Project mapToEntity(ProjectDTO dto) {
        // Company entity will be set in the service method, not from DTO directly for new projects
        // For updates, it will be mapped onto the existing entity
        return Project.builder()
                .id(dto.getId())
                .name(dto.getName())
                .description(dto.getDescription())
                .dailyRate(dto.getDailyRate())
                .hourlyRate(dto.getHourlyRate())
                .currency(dto.getCurrency())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .estimatedHours(dto.getEstimatedHours())
                .status(dto.getStatus())
                .userEmail(dto.getUserEmail())
                .build();
    }

    private void updateProjectFromDTO(Project project, ProjectDTO dto) {
        if (dto.getName() != null) project.setName(dto.getName());
        if (dto.getDescription() != null) project.setDescription(dto.getDescription());
        if (dto.getDailyRate() != null) project.setDailyRate(dto.getDailyRate());
        if (dto.getHourlyRate() != null) project.setHourlyRate(dto.getHourlyRate());
        if (dto.getCurrency() != null) project.setCurrency(dto.getCurrency());
        if (dto.getStartDate() != null) project.setStartDate(dto.getStartDate());
        if (dto.getEndDate() != null) project.setEndDate(dto.getEndDate());
        if (dto.getEstimatedHours() != null) project.setEstimatedHours(dto.getEstimatedHours());
        if (dto.getStatus() != null) project.setStatus(dto.getStatus());
    }

    private boolean existsByCompanyIdAndId(Long companyId, Long projectId) {
        return projectRepository.findByCompanyIdAndId(companyId, projectId).isPresent();
    }
} 
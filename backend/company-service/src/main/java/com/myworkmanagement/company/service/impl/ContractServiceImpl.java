package com.myworkmanagement.company.service.impl;

import com.myworkmanagement.company.dto.ContractDTO;
import com.myworkmanagement.company.entity.Company;
import com.myworkmanagement.company.entity.Contract;
import com.myworkmanagement.company.entity.ContractStatus;
import com.myworkmanagement.company.entity.Project;
import com.myworkmanagement.company.exception.ResourceNotFoundException;
import com.myworkmanagement.company.repository.CompanyRepository;
import com.myworkmanagement.company.repository.ContractRepository;
import com.myworkmanagement.company.repository.ProjectRepository;
import com.myworkmanagement.company.service.ContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ContractServiceImpl implements ContractService {

    private final ContractRepository contractRepository;
    private final CompanyRepository companyRepository;
    private final ProjectRepository projectRepository;

    @Override
    public ContractDTO createContract(Long companyId, ContractDTO dto) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));

        if (contractRepository.findByCode(dto.getCode()).isPresent()) {
            throw new IllegalArgumentException("Contract with code \"" + dto.getCode() + "\" already exists.");
        }

        Contract contract = Contract.builder()
                .company(company)
                .name(dto.getName())
                .code(dto.getCode())
                .totalAmount(dto.getTotalAmount())
                .amountAvailable(dto.getAmountAvailable())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .notes(dto.getNotes())
                .status(dto.getStatus() != null ? dto.getStatus() : ContractStatus.OPEN)
                .userEmail(dto.getUserEmail())
                .projects(resolveProjects(dto.getProjectIds()))
                .build();

        return mapToDTO(contractRepository.save(contract));
    }

    @Override
    public ContractDTO updateContract(Long companyId, Long contractId, ContractDTO dto) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found with id: " + contractId));

        if (!contract.getCompany().getId().equals(companyId)) {
            throw new ResourceNotFoundException("Contract not found with id: " + contractId + " for company: " + companyId);
        }

        if (dto.getCode() != null && !contract.getCode().equals(dto.getCode())) {
            contractRepository.findByCode(dto.getCode()).ifPresent(existing -> {
                if (!existing.getId().equals(contractId)) {
                    throw new IllegalArgumentException("Contract with code \"" + dto.getCode() + "\" already exists.");
                }
            });
        }

        if (dto.getName() != null) contract.setName(dto.getName());
        if (dto.getCode() != null) contract.setCode(dto.getCode());
        if (dto.getTotalAmount() != null) contract.setTotalAmount(dto.getTotalAmount());
        if (dto.getAmountAvailable() != null) contract.setAmountAvailable(dto.getAmountAvailable());
        if (dto.getStartDate() != null) contract.setStartDate(dto.getStartDate());
        if (dto.getEndDate() != null) contract.setEndDate(dto.getEndDate());
        if (dto.getNotes() != null) contract.setNotes(dto.getNotes());
        if (dto.getStatus() != null) contract.setStatus(dto.getStatus());
        if (dto.getProjectIds() != null) {
            contract.setProjects(resolveProjects(dto.getProjectIds()));
        }

        return mapToDTO(contractRepository.save(contract));
    }

    @Override
    @Transactional(readOnly = true)
    public ContractDTO getContractById(Long contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found with id: " + contractId));
        return mapToDTO(contract);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ContractDTO> getContractsByUserEmail(String userEmail, Pageable pageable) {
        return contractRepository.findByUserEmail(userEmail, pageable).map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContractDTO> getContractsByCompany(Long companyId, String userEmail) {
        return contractRepository.findByCompanyIdAndUserEmail(companyId, userEmail)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContractDTO> getContractsByProject(Long projectId) {
        return contractRepository.findByProjectId(projectId)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public void deleteContract(Long companyId, Long contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found with id: " + contractId));

        if (!contract.getCompany().getId().equals(companyId)) {
            throw new ResourceNotFoundException("Contract not found with id: " + contractId + " for company: " + companyId);
        }

        contractRepository.deleteById(contractId);
    }

    private Set<Project> resolveProjects(List<Long> projectIds) {
        if (projectIds == null || projectIds.isEmpty()) {
            return new HashSet<>();
        }
        List<Project> projects = projectRepository.findAllById(projectIds);
        return new HashSet<>(projects);
    }

    private ContractDTO mapToDTO(Contract contract) {
        List<Long> projectIds = contract.getProjects() != null
                ? contract.getProjects().stream().map(Project::getId).collect(Collectors.toList())
                : List.of();

        return ContractDTO.builder()
                .id(contract.getId())
                .companyId(contract.getCompany().getId())
                .companyName(contract.getCompany().getName())
                .name(contract.getName())
                .code(contract.getCode())
                .totalAmount(contract.getTotalAmount())
                .amountAvailable(contract.getAmountAvailable())
                .startDate(contract.getStartDate())
                .endDate(contract.getEndDate())
                .notes(contract.getNotes())
                .status(contract.getStatus())
                .projectIds(projectIds)
                .userEmail(contract.getUserEmail())
                .createdAt(contract.getCreatedAt())
                .updatedAt(contract.getUpdatedAt())
                .build();
    }
}

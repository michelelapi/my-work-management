package com.myworkmanagement.company.service.impl;

import com.myworkmanagement.company.dto.CompanyDTO;
import com.myworkmanagement.company.entity.Company;
import com.myworkmanagement.company.entity.CompanyStatus;
import com.myworkmanagement.company.exception.ResourceNotFoundException;
import com.myworkmanagement.company.repository.CompanyRepository;
import com.myworkmanagement.company.service.CompanyService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository companyRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<CompanyDTO> getAllCompaniesByUserEmail(String userEmail, Pageable pageable) {
        return companyRepository.findAllByUserEmail(userEmail, pageable)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyDTO getCompanyById(Long id) {
        return companyRepository.findById(id)
                .map(this::mapToDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));
    }

    @Override
    public CompanyDTO createCompany(CompanyDTO companyDTO) {
        validateCompanyUniqueness(companyDTO);
        Company company = mapToEntity(companyDTO);
        company.setStatus(CompanyStatus.ACTIVE);
        return mapToDTO(companyRepository.save(company));
    }

    @Override
    public CompanyDTO updateCompany(Long id, CompanyDTO companyDTO) {
        Company existingCompany = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));
        
        validateCompanyUniquenessForUpdate(companyDTO, id);
        
        updateCompanyFromDTO(existingCompany, companyDTO);
        return mapToDTO(companyRepository.save(existingCompany));
    }

    @Override
    public void deleteCompany(Long id) {
        if (!companyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Company not found with id: " + id);
        }
        companyRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByName(String name) {
        return companyRepository.existsByName(name);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return companyRepository.existsByEmail(email);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByTaxId(String taxId) {
        return companyRepository.existsByTaxId(taxId);
    }

    private void validateCompanyUniqueness(CompanyDTO companyDTO) {
        if (companyDTO.getName() != null && existsByName(companyDTO.getName())) {
            throw new IllegalArgumentException("Company with name " + companyDTO.getName() + " already exists");
        }
        if (companyDTO.getEmail() != null && existsByEmail(companyDTO.getEmail())) {
            throw new IllegalArgumentException("Company with email " + companyDTO.getEmail() + " already exists");
        }
        if (companyDTO.getTaxId() != null && existsByTaxId(companyDTO.getTaxId())) {
            throw new IllegalArgumentException("Company with tax ID " + companyDTO.getTaxId() + " already exists");
        }
    }

    private void validateCompanyUniquenessForUpdate(CompanyDTO companyDTO, Long id) {
        if (companyDTO.getName() != null) {
            companyRepository.findByName(companyDTO.getName())
                    .ifPresent(company -> {
                        if (!company.getId().equals(id)) {
                            throw new IllegalArgumentException("Company with name " + companyDTO.getName() + " already exists");
                        }
                    });
        }
        if (companyDTO.getEmail() != null) {
            companyRepository.findByEmail(companyDTO.getEmail())
                    .ifPresent(company -> {
                        if (!company.getId().equals(id)) {
                            throw new IllegalArgumentException("Company with email " + companyDTO.getEmail() + " already exists");
                        }
                    });
        }
        if (companyDTO.getTaxId() != null) {
            companyRepository.findByTaxId(companyDTO.getTaxId())
                    .ifPresent(company -> {
                        if (!company.getId().equals(id)) {
                            throw new IllegalArgumentException("Company with tax ID " + companyDTO.getTaxId() + " already exists");
                        }
                    });
        }
    }

    private void updateCompanyFromDTO(Company company, CompanyDTO dto) {
        company.setName(dto.getName());
        company.setDescription(dto.getDescription());
        company.setContactPerson(dto.getContactPerson());
        company.setEmail(dto.getEmail());
        company.setPhone(dto.getPhone());
        company.setAddress(dto.getAddress());
        company.setWebsite(dto.getWebsite());
        company.setTaxId(dto.getTaxId());
        company.setPaymentTerms(dto.getPaymentTerms());
        if (dto.getStatus() != null) {
            company.setStatus(dto.getStatus());
        }
        company.setUserEmail(dto.getUserEmail());
    }

    private CompanyDTO mapToDTO(Company company) {
        return CompanyDTO.builder()
                .id(company.getId())
                .name(company.getName())
                .description(company.getDescription())
                .contactPerson(company.getContactPerson())
                .email(company.getEmail())
                .phone(company.getPhone())
                .address(company.getAddress())
                .website(company.getWebsite())
                .taxId(company.getTaxId())
                .paymentTerms(company.getPaymentTerms())
                .status(company.getStatus())
                .createdAt(company.getCreatedAt())
                .updatedAt(company.getUpdatedAt())
                .userEmail(company.getUserEmail())
                .build();
    }

    private Company mapToEntity(CompanyDTO dto) {
        return Company.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .contactPerson(dto.getContactPerson())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .address(dto.getAddress())
                .website(dto.getWebsite())
                .taxId(dto.getTaxId())
                .paymentTerms(dto.getPaymentTerms())
                .status(dto.getStatus())
                .userEmail(dto.getUserEmail())
                .build();
    }
} 
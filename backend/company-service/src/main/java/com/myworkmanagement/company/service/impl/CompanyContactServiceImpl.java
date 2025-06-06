package com.myworkmanagement.company.service.impl;

import com.myworkmanagement.company.dto.CompanyContactDTO;
import com.myworkmanagement.company.entity.Company;
import com.myworkmanagement.company.entity.CompanyContact;
import com.myworkmanagement.company.exception.ResourceNotFoundException;
import com.myworkmanagement.company.repository.CompanyContactRepository;
import com.myworkmanagement.company.repository.CompanyRepository;
import com.myworkmanagement.company.service.CompanyContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CompanyContactServiceImpl implements CompanyContactService {

    private final CompanyContactRepository contactRepository;
    private final CompanyRepository companyRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<CompanyContactDTO> getCompanyContacts(Long companyId, Pageable pageable) {
        validateCompanyExists(companyId);
        return contactRepository.findByCompanyId(companyId, pageable)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyContactDTO getCompanyContactById(Long companyId, Long contactId) {
        validateCompanyExists(companyId);
        return contactRepository.findById(contactId)
                .filter(contact -> contact.getCompany().getId().equals(companyId))
                .map(this::mapToDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found with id: " + contactId));
    }

    @Override
    public CompanyContactDTO createCompanyContact(Long companyId, CompanyContactDTO contactDTO) {
        Company company = validateCompanyExists(companyId);
        
        if (contactDTO.isPrimary() && contactRepository.existsByCompanyIdAndIsPrimaryTrue(companyId)) {
            throw new IllegalArgumentException("Company already has a primary contact");
        }
        
        CompanyContact contact = mapToEntity(contactDTO);
        contact.setCompany(company);
        return mapToDTO(contactRepository.save(contact));
    }

    @Override
    public CompanyContactDTO updateCompanyContact(Long companyId, Long contactId, CompanyContactDTO contactDTO) {
        validateCompanyExists(companyId);
        
        CompanyContact existingContact = contactRepository.findById(contactId)
                .filter(contact -> contact.getCompany().getId().equals(companyId))
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found with id: " + contactId));
        
        if (contactDTO.isPrimary() && !existingContact.isPrimary()) {
            if (contactRepository.existsByCompanyIdAndIsPrimaryTrue(companyId)) {
                throw new IllegalArgumentException("Company already has a primary contact");
            }
        }
        
        updateContactFromDTO(existingContact, contactDTO);
        return mapToDTO(contactRepository.save(existingContact));
    }

    @Override
    public void deleteCompanyContact(Long companyId, Long contactId) {
        validateCompanyExists(companyId);
        
        CompanyContact contact = contactRepository.findById(contactId)
                .filter(c -> c.getCompany().getId().equals(companyId))
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found with id: " + contactId));
        
        contactRepository.delete(contact);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CompanyContactDTO> searchContacts(Long companyId, String searchTerm, Pageable pageable) {
        validateCompanyExists(companyId);
        return contactRepository.searchContacts(companyId, searchTerm, pageable)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyContactDTO getPrimaryContact(Long companyId) {
        validateCompanyExists(companyId);
        return contactRepository.findByCompanyIdAndIsPrimaryTrue(companyId)
                .map(this::mapToDTO)
                .orElseThrow(() -> new ResourceNotFoundException("No primary contact found for company: " + companyId));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsPrimaryContact(Long companyId) {
        validateCompanyExists(companyId);
        return contactRepository.existsByCompanyIdAndIsPrimaryTrue(companyId);
    }

    private Company validateCompanyExists(Long companyId) {
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));
    }

    private void updateContactFromDTO(CompanyContact contact, CompanyContactDTO dto) {
        contact.setName(dto.getName());
        contact.setEmail(dto.getEmail());
        contact.setPhone(dto.getPhone());
        contact.setRole(dto.getRole());
        contact.setPrimary(dto.isPrimary());
    }

    private CompanyContactDTO mapToDTO(CompanyContact contact) {
        return CompanyContactDTO.builder()
                .id(contact.getId())
                .companyId(contact.getCompany().getId())
                .name(contact.getName())
                .email(contact.getEmail())
                .phone(contact.getPhone())
                .role(contact.getRole())
                .isPrimary(contact.isPrimary())
                .createdAt(contact.getCreatedAt())
                .build();
    }

    private CompanyContact mapToEntity(CompanyContactDTO dto) {
        return CompanyContact.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .role(dto.getRole())
                .isPrimary(dto.isPrimary())
                .build();
    }
} 
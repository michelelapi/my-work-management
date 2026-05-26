package com.myworkmanagement.company.service;

import com.myworkmanagement.company.dto.ContractDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ContractService {

    ContractDTO createContract(Long companyId, ContractDTO contractDTO);

    ContractDTO updateContract(Long companyId, Long contractId, ContractDTO contractDTO);

    ContractDTO getContractById(Long contractId);

    Page<ContractDTO> getContractsByUserEmail(String userEmail, Pageable pageable);

    List<ContractDTO> getContractsByCompany(Long companyId, String userEmail);

    List<ContractDTO> getContractsByProject(Long projectId);

    void deleteContract(Long companyId, Long contractId);
}

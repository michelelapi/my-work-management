package com.myworkmanagement.company.controller;

import com.myworkmanagement.company.dto.ContractDTO;
import com.myworkmanagement.company.service.ContractService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Contract", description = "Contract management APIs")
@SecurityRequirement(name = "bearerAuth")
public class ContractController {

    private final ContractService contractService;

    @PostMapping("/companies/{companyId}/contracts")
    @Operation(summary = "Create a new contract", description = "Creates a new contract for a company")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Contract created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Company not found")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ContractDTO> createContract(
            @Parameter(description = "Company ID", required = true) @PathVariable Long companyId,
            @Valid @RequestBody ContractDTO contractDTO) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        contractDTO.setUserEmail(auth.getName());
        return new ResponseEntity<>(contractService.createContract(companyId, contractDTO), HttpStatus.CREATED);
    }

    @PutMapping("/companies/{companyId}/contracts/{contractId}")
    @Operation(summary = "Update a contract", description = "Updates an existing contract")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Contract updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Contract not found")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ContractDTO> updateContract(
            @Parameter(description = "Company ID", required = true) @PathVariable Long companyId,
            @Parameter(description = "Contract ID", required = true) @PathVariable Long contractId,
            @Valid @RequestBody ContractDTO contractDTO) {
        return ResponseEntity.ok(contractService.updateContract(companyId, contractId, contractDTO));
    }

    @GetMapping("/contracts/{contractId}")
    @Operation(summary = "Get contract by ID", description = "Retrieves a contract by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved contract"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Contract not found")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ContractDTO> getContract(
            @Parameter(description = "Contract ID", required = true) @PathVariable Long contractId) {
        return ResponseEntity.ok(contractService.getContractById(contractId));
    }

    @GetMapping("/contracts")
    @Operation(summary = "Get all contracts for the authenticated user", description = "Retrieves a paginated list of all contracts")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved contracts"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<ContractDTO>> getAllContracts(Pageable pageable) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(contractService.getContractsByUserEmail(auth.getName(), pageable));
    }

    @GetMapping("/companies/{companyId}/contracts")
    @Operation(summary = "Get contracts by company", description = "Retrieves all contracts for a company")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved contracts"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Company not found")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<ContractDTO>> getContractsByCompany(
            @Parameter(description = "Company ID", required = true) @PathVariable Long companyId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(contractService.getContractsByCompany(companyId, auth.getName()));
    }

    @GetMapping("/projects/{projectId}/contracts")
    @Operation(summary = "Get contracts linked to a project", description = "Retrieves all contracts linked to a specific project")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved contracts"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<ContractDTO>> getContractsByProject(
            @Parameter(description = "Project ID", required = true) @PathVariable Long projectId) {
        return ResponseEntity.ok(contractService.getContractsByProject(projectId));
    }

    @DeleteMapping("/companies/{companyId}/contracts/{contractId}")
    @Operation(summary = "Delete a contract", description = "Deletes a contract by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Contract deleted successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Contract not found")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Void> deleteContract(
            @Parameter(description = "Company ID", required = true) @PathVariable Long companyId,
            @Parameter(description = "Contract ID", required = true) @PathVariable Long contractId) {
        contractService.deleteContract(companyId, contractId);
        return ResponseEntity.noContent().build();
    }
}

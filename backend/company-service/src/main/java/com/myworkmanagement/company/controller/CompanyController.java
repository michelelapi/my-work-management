package com.myworkmanagement.company.controller;

import com.myworkmanagement.company.dto.CompanyDTO;
import com.myworkmanagement.company.service.CompanyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
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

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@Tag(name = "Company", description = "Company management APIs")
@SecurityRequirement(name = "bearerAuth")
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping
    @Operation(summary = "Get all companies", description = "Retrieves a paginated list of all companies for the authenticated user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved companies"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<CompanyDTO>> getAllCompanies(
            @Parameter(description = "Pagination parameters (page, size, sort)", required = false) Pageable pageable) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return ResponseEntity.ok(companyService.getAllCompaniesByUserEmail(userEmail, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get company by ID", description = "Retrieves a company by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved company"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Company not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<CompanyDTO> getCompanyById(
            @Parameter(description = "Unique identifier of the company", required = true, example = "1") @PathVariable Long id) {
        return ResponseEntity.ok(companyService.getCompanyById(id));
    }

    @PostMapping
    @Operation(summary = "Create new company", description = "Creates a new company with the provided details")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Company created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "409", description = "Company with same name/email/taxId already exists"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CompanyDTO> createCompany(
            @Parameter(description = "Company data", required = true, schema = @Schema(implementation = CompanyDTO.class))
            @Valid @RequestBody CompanyDTO companyDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        companyDTO.setUserEmail(userEmail);
        return new ResponseEntity<>(companyService.createCompany(companyDTO), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update company", description = "Updates an existing company with the provided details")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Company updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Company not found"),
        @ApiResponse(responseCode = "409", description = "Company with same name/email/taxId already exists"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CompanyDTO> updateCompany(
            @Parameter(description = "Unique identifier of the company to update", required = true, example = "1") @PathVariable Long id,
            @Parameter(description = "Updated company data", required = true, schema = @Schema(implementation = CompanyDTO.class))
            @Valid @RequestBody CompanyDTO companyDTO) {
        return ResponseEntity.ok(companyService.updateCompany(id, companyDTO));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete company", description = "Deletes a company by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Company deleted successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Company not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCompany(
            @Parameter(description = "Unique identifier of the company to delete", required = true, example = "1") @PathVariable Long id) {
        companyService.deleteCompany(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    @Operation(summary = "Search companies", description = "Searches companies by name or email with pagination support")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved companies"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<CompanyDTO>> searchCompanies(
            @Parameter(description = "Search term to filter companies by name or email", required = true, example = "example") @RequestParam String searchTerm,
            @Parameter(description = "Pagination parameters (page, size, sort)", required = false) Pageable pageable) {
        return ResponseEntity.ok(companyService.searchCompanies(searchTerm, pageable));
    }

    @GetMapping("/name/{name}")
    @Operation(summary = "Get company by name", description = "Retrieves a company by its exact name")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved company"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Company not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<CompanyDTO> getCompanyByName(
            @Parameter(description = "Name of the company", required = true, example = "Acme Corp") @PathVariable String name) {
        return ResponseEntity.ok(companyService.getCompanyByName(name));
    }
} 
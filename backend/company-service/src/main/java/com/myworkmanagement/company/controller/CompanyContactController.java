package com.myworkmanagement.company.controller;

import com.myworkmanagement.company.dto.CompanyContactDTO;
import com.myworkmanagement.company.service.CompanyContactService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/companies/{companyId}/contacts")
@RequiredArgsConstructor
@Tag(name = "Company Contact", description = "Company contact management APIs")
public class CompanyContactController {

    private final CompanyContactService contactService;

    @GetMapping
    @Operation(summary = "Get company contacts", description = "Retrieves a paginated list of contacts for a company")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved contacts"),
        @ApiResponse(responseCode = "404", description = "Company not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<Page<CompanyContactDTO>> getCompanyContacts(
            @Parameter(description = "Company ID", required = true) @PathVariable Long companyId,
            Pageable pageable) {
        return ResponseEntity.ok(contactService.getCompanyContacts(companyId, pageable));
    }

    @GetMapping("/{contactId}")
    @Operation(summary = "Get contact by ID", description = "Retrieves a contact by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved contact"),
        @ApiResponse(responseCode = "404", description = "Company or contact not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<CompanyContactDTO> getCompanyContactById(
            @Parameter(description = "Company ID", required = true) @PathVariable Long companyId,
            @Parameter(description = "Contact ID", required = true) @PathVariable Long contactId) {
        return ResponseEntity.ok(contactService.getCompanyContactById(companyId, contactId));
    }

    @PostMapping
    @Operation(summary = "Create new contact", description = "Creates a new contact for a company")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Contact created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "404", description = "Company not found"),
        @ApiResponse(responseCode = "409", description = "Company already has a primary contact"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<CompanyContactDTO> createCompanyContact(
            @Parameter(description = "Company ID", required = true) @PathVariable Long companyId,
            @Parameter(description = "Contact data", required = true)
            @Valid @RequestBody CompanyContactDTO contactDTO) {
        return new ResponseEntity<>(contactService.createCompanyContact(companyId, contactDTO), HttpStatus.CREATED);
    }

    @PutMapping("/{contactId}")
    @Operation(summary = "Update contact", description = "Updates an existing contact")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Contact updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "404", description = "Company or contact not found"),
        @ApiResponse(responseCode = "409", description = "Company already has a primary contact"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<CompanyContactDTO> updateCompanyContact(
            @Parameter(description = "Company ID", required = true) @PathVariable Long companyId,
            @Parameter(description = "Contact ID", required = true) @PathVariable Long contactId,
            @Parameter(description = "Updated contact data", required = true)
            @Valid @RequestBody CompanyContactDTO contactDTO) {
        return ResponseEntity.ok(contactService.updateCompanyContact(companyId, contactId, contactDTO));
    }

    @DeleteMapping("/{contactId}")
    @Operation(summary = "Delete contact", description = "Deletes a contact by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Contact deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Company or contact not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<Void> deleteCompanyContact(
            @Parameter(description = "Company ID", required = true) @PathVariable Long companyId,
            @Parameter(description = "Contact ID", required = true) @PathVariable Long contactId) {
        contactService.deleteCompanyContact(companyId, contactId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    @Operation(summary = "Search contacts", description = "Searches contacts by name or email")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved contacts"),
        @ApiResponse(responseCode = "404", description = "Company not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<Page<CompanyContactDTO>> searchContacts(
            @Parameter(description = "Company ID", required = true) @PathVariable Long companyId,
            @Parameter(description = "Search term") @RequestParam String searchTerm,
            Pageable pageable) {
        return ResponseEntity.ok(contactService.searchContacts(companyId, searchTerm, pageable));
    }

    @GetMapping("/primary")
    @Operation(summary = "Get primary contact", description = "Retrieves the primary contact for a company")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved primary contact"),
        @ApiResponse(responseCode = "404", description = "Company not found or no primary contact exists"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<CompanyContactDTO> getPrimaryContact(
            @Parameter(description = "Company ID", required = true) @PathVariable Long companyId) {
        return ResponseEntity.ok(contactService.getPrimaryContact(companyId));
    }
} 
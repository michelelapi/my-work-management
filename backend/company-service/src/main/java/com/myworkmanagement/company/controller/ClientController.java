package com.myworkmanagement.company.controller;

import com.myworkmanagement.company.dto.ClientDTO;
import com.myworkmanagement.company.service.ClientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
@Tag(name = "Client", description = "Client management APIs")
@SecurityRequirement(name = "bearerAuth")
public class ClientController {

    private final ClientService clientService;

    @GetMapping("/projects/{projectId}/clients")
    @Operation(summary = "Get all clients for a project", description = "Retrieves a list of all clients for a specific project")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved clients"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Project not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<ClientDTO>> getAllClientsByProjectId(
            @Parameter(description = "Unique identifier of the project", required = true, example = "1") @PathVariable Long projectId) {
        return ResponseEntity.ok(clientService.getAllClientsByProjectId(projectId));
    }

    @GetMapping("/projects/{projectId}/clients/{clientId}")
    @Operation(summary = "Get client by ID", description = "Retrieves a client by its ID for a specific project")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved client"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Project or client not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ClientDTO> getClientById(
            @Parameter(description = "Unique identifier of the project", required = true, example = "1") @PathVariable Long projectId,
            @Parameter(description = "Unique identifier of the client", required = true, example = "1") @PathVariable Long clientId) {
        return ResponseEntity.ok(clientService.getClientById(projectId, clientId));
    }

    @PostMapping("/projects/{projectId}/clients")
    @Operation(summary = "Create new client", description = "Creates a new client for a project")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Client created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Project not found"),
        @ApiResponse(responseCode = "409", description = "Client with same name already exists for this project"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClientDTO> createClient(
            @Parameter(description = "Unique identifier of the project", required = true, example = "1") @PathVariable Long projectId,
            @Parameter(description = "Client data", required = true, schema = @Schema(implementation = ClientDTO.class))
            @Valid @RequestBody ClientDTO clientDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        clientDTO.setUserEmail(userEmail);
        return new ResponseEntity<>(clientService.createClient(projectId, clientDTO), HttpStatus.CREATED);
    }

    @PutMapping("/projects/{projectId}/clients/{clientId}")
    @Operation(summary = "Update client", description = "Updates an existing client for a project")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Client updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Project or client not found"),
        @ApiResponse(responseCode = "409", description = "Client with same name already exists for this project"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClientDTO> updateClient(
            @Parameter(description = "Unique identifier of the project", required = true, example = "1") @PathVariable Long projectId,
            @Parameter(description = "Unique identifier of the client", required = true, example = "1") @PathVariable Long clientId,
            @Parameter(description = "Updated client data", required = true, schema = @Schema(implementation = ClientDTO.class))
            @Valid @RequestBody ClientDTO clientDTO) {
        return ResponseEntity.ok(clientService.updateClient(projectId, clientId, clientDTO));
    }

    @DeleteMapping("/projects/{projectId}/clients/{clientId}")
    @Operation(summary = "Delete client", description = "Deletes a client by its ID for a specific project")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Client deleted successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Project or client not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteClient(
            @Parameter(description = "Unique identifier of the project", required = true, example = "1") @PathVariable Long projectId,
            @Parameter(description = "Unique identifier of the client", required = true, example = "1") @PathVariable Long clientId) {
        clientService.deleteClient(projectId, clientId);
        return ResponseEntity.noContent().build();
    }
}

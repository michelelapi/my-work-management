package com.myworkmanagement.company.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Client data transfer object")
public class ClientDTO {

    @Schema(description = "Unique identifier of the client", example = "1")
    private Long id;

    @Schema(description = "ID of the project this client belongs to", example = "1", required = true)
    @NotNull(message = "Project ID is required")
    private Long projectId;

    @Schema(description = "Name of the client", example = "Acme Corporation", required = true)
    @NotBlank(message = "Client name is required")
    private String name;

    @Schema(description = "Detailed description of the client", example = "Main client for the project")
    private String description;

    @Schema(description = "Contact email of the client", example = "contact@acme.com")
    private String contactEmail;

    @Schema(description = "Contact phone of the client", example = "+1234567890")
    private String contactPhone;

    @Schema(description = "Timestamp when the client was created", example = "2024-03-20T10:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "Timestamp when the client was last updated", example = "2024-03-20T10:00:00")
    private LocalDateTime updatedAt;

    @Schema(description = "Email of the user who owns/manages this client", example = "user@example.com")
    private String userEmail;
}

package com.myworkmanagement.company.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Company contact data transfer object")
public class CompanyContactDTO {
    @Schema(description = "Unique identifier of the contact", example = "1")
    private Long id;

    @Schema(description = "ID of the company this contact belongs to", example = "1")
    private Long companyId;
    
    @Schema(description = "Full name of the contact person", example = "John Doe", required = true)
    @NotBlank(message = "Contact name is required")
    private String name;
    
    @Schema(description = "Email address of the contact", example = "john.doe@example.com", required = true)
    @Email(message = "Invalid email format")
    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "Invalid email format")
    private String email;
    
    @Schema(description = "Phone number of the contact", example = "+1234567890")
    private String phone;

    @Schema(description = "Role or position of the contact in the company", example = "Project Manager")
    private String role;

    @Schema(description = "Indicates if this is the primary contact for the company", example = "true")
    private boolean isPrimary;

    @Schema(description = "Timestamp when the contact was created", example = "2024-03-20T10:00:00")
    private LocalDateTime createdAt;
} 
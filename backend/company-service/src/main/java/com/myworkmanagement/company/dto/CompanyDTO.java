package com.myworkmanagement.company.dto;

import com.myworkmanagement.company.entity.CompanyStatus;
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
@Schema(description = "Company data transfer object")
public class CompanyDTO {
    @Schema(description = "Unique identifier of the company", example = "1")
    private Long id;
    
    @Schema(description = "Name of the company", example = "Example Corp", required = true)
    @NotBlank(message = "Company name is required")
    private String name;
    
    @Schema(description = "Detailed description of the company", example = "A leading technology company")
    private String description;

    @Schema(description = "Name of the primary contact person", example = "John Doe")
    private String contactPerson;
    
    @Schema(description = "Company's email address", example = "contact@example.com", required = true)
    @Email(message = "Invalid email format")
    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "Invalid email format")
    private String email;
    
    @Schema(description = "Company's phone number", example = "+1234567890")
    private String phone;

    @Schema(description = "Company's physical address", example = "123 Business St, City, Country")
    private String address;

    @Schema(description = "Company's website URL", example = "https://www.example.com")
    private String website;

    @Schema(description = "Company's tax identification number", example = "TAX123456")
    private String taxId;

    @Schema(description = "Payment terms in days", example = "30")
    private Integer paymentTerms;

    @Schema(description = "Current status of the company", example = "ACTIVE")
    private CompanyStatus status;

    @Schema(description = "Timestamp when the company was created", example = "2024-03-20T10:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "Timestamp when the company was last updated", example = "2024-03-20T10:00:00")
    private LocalDateTime updatedAt;

    @Schema(description = "Email of the user who owns/manages this company", example = "user@example.com")
    private String userEmail;
} 
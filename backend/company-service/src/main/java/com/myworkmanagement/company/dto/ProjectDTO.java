package com.myworkmanagement.company.dto;

import com.myworkmanagement.company.entity.ProjectStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Project data transfer object")
public class ProjectDTO {

    @Schema(description = "Unique identifier of the project", example = "1")
    private Long id;

    @Schema(description = "ID of the company this project belongs to", example = "1")
    private Long companyId;

    @Schema(description = "Name of the project", example = "Website Redesign", required = true)
    @NotBlank(message = "Project name is required")
    private String name;

    @Schema(description = "Detailed description of the project", example = "Complete redesign of the company website with modern UI/UX")
    private String description;

    @Schema(description = "Daily rate for the project in the specified currency", example = "500.00")
    private BigDecimal dailyRate;

    @Schema(description = "Hourly rate for the project in the specified currency", example = "62.50")
    private BigDecimal hourlyRate;

    @Schema(description = "Currency code for the project rates", example = "USD")
    private String currency;

    @Schema(description = "Project start date", example = "2024-03-20")
    private LocalDate startDate;

    @Schema(description = "Project end date", example = "2024-06-20")
    private LocalDate endDate;

    @Schema(description = "Estimated total hours for the project", example = "160")
    private Integer estimatedHours;

    @Schema(description = "Current status of the project", example = "IN_PROGRESS")
    private ProjectStatus status;

    @Schema(description = "Timestamp when the project was created", example = "2024-03-20T10:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "Timestamp when the project was last updated", example = "2024-03-20T10:00:00")
    private LocalDateTime updatedAt;

    @Schema(description = "Name of the company this project belongs to", example = "Example Corp")
    private String companyName;

    @Schema(description = "Email of the user who owns/manages this project", example = "user@example.com")
    private String userEmail;
} 
package com.myworkmanagement.company.dto;

import com.myworkmanagement.company.entity.ProjectStatus;
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
public class ProjectDTO {

    private Long id;

    @NotNull(message = "Company ID is required")
    private Long companyId;

    @NotBlank(message = "Project name is required")
    private String name;

    private String description;

    @Positive(message = "Daily rate must be positive")
    private BigDecimal dailyRate;

    @Positive(message = "Hourly rate must be positive")
    private BigDecimal hourlyRate;

    private String currency;

    private LocalDate startDate;

    private LocalDate endDate;

    @Positive(message = "Estimated hours must be positive")
    private Integer estimatedHours;

    private ProjectStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String companyName;
    private String userEmail;

} 
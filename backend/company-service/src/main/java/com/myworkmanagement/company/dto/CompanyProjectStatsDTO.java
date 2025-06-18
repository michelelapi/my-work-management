package com.myworkmanagement.company.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Company project statistics data transfer object")
public class CompanyProjectStatsDTO {
    @Schema(description = "Unique identifier of the company", example = "1")
    private Long companyId;

    @Schema(description = "Name of the company", example = "Example Corp")
    private String companyName;

    @Schema(description = "Total number of projects in the company", example = "5")
    private Long projectCount;

    @Schema(description = "Total number of tasks across all projects", example = "25")
    private Long taskCount;

    @Schema(description = "Total hours worked across all tasks", example = "160")
    private Integer totalHours;

    @Schema(description = "Total amount billed for all tasks", example = "10000.00")
    private BigDecimal totalAmount;

    @Schema(description = "Total amount for tasks to be billed (isBilled = false)", example = "1200.00")
    private BigDecimal totalToBeBilledAmount;

    @Schema(description = "Total amount for tasks to be paid (isPaid = false)", example = "800.00")
    private BigDecimal totalToBePaidAmount;

    @Schema(description = "Currency code for the company/project", example = "EUR")
    private String currency;
} 
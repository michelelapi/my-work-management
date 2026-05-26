package com.myworkmanagement.company.dto;

import com.myworkmanagement.company.entity.ContractStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Contract data transfer object")
public class ContractDTO {

    @Schema(description = "Unique identifier of the contract", example = "1")
    private Long id;

    @Schema(description = "ID of the company this contract belongs to", example = "1")
    @NotNull(message = "Company ID is required")
    private Long companyId;

    @Schema(description = "Name of the company this contract belongs to", example = "Dedagroup")
    private String companyName;

    @Schema(description = "Name of the contract", example = "Maintenance 2026")
    @NotBlank(message = "Contract name is required")
    private String name;

    @Schema(description = "Unique code of the contract", example = "CTR-2026-001")
    @NotBlank(message = "Contract code is required")
    private String code;

    @Schema(description = "Total amount of the contract", example = "50000.00")
    @NotNull(message = "Total amount is required")
    private BigDecimal totalAmount;

    @Schema(description = "Amount still available", example = "35000.00")
    @NotNull(message = "Amount available is required")
    private BigDecimal amountAvailable;

    @Schema(description = "Contract start date", example = "2026-01-01")
    private LocalDate startDate;

    @Schema(description = "Contract end date", example = "2026-12-31")
    private LocalDate endDate;

    @Schema(description = "Additional notes", example = "Annual maintenance contract")
    private String notes;

    @Schema(description = "Contract status", example = "OPEN")
    private ContractStatus status;

    @Schema(description = "IDs of projects linked to this contract")
    private List<Long> projectIds;

    @Schema(description = "Email of the user who owns this contract")
    private String userEmail;

    @Schema(description = "Timestamp when the contract was created")
    private LocalDateTime createdAt;

    @Schema(description = "Timestamp when the contract was last updated")
    private LocalDateTime updatedAt;
}

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
@Schema(description = "Tracks how much money a task consumed from a contract")
public class TaskContractUsageDTO {

    @Schema(description = "ID of the contract", example = "1")
    private Long contractId;

    @Schema(description = "Code of the contract", example = "CTR-2026-001")
    private String contractCode;

    @Schema(description = "Amount used from this contract for the task", example = "500.00")
    private BigDecimal amountUsed;
}

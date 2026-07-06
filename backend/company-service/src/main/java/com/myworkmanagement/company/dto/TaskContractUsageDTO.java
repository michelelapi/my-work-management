package com.myworkmanagement.company.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Tracks how much money a task consumed from a contract")
public class TaskContractUsageDTO {

    @Schema(description = "ID of the contract usage record", example = "1")
    private Long id;

    @Schema(description = "ID of the contract", example = "1")
    private Long contractId;

    @Schema(description = "Code of the contract", example = "CTR-2026-001")
    private String contractCode;

    @Schema(description = "Amount used from this contract for the task", example = "500.00")
    private BigDecimal amountUsed;

    @Schema(description = "Invoice ID for this contract portion", example = "INV-001")
    private String invoiceId;

    @Schema(description = "Billing date for this contract portion", example = "2024-03-25")
    private LocalDate billingDate;

    @Schema(description = "Payment date for this contract portion", example = "2024-04-01")
    private LocalDate paymentDate;

    @Schema(description = "Whether this contract portion has been billed", example = "true")
    private Boolean isBilled;

    @Schema(description = "Whether this contract portion has been paid", example = "true")
    private Boolean isPaid;
}

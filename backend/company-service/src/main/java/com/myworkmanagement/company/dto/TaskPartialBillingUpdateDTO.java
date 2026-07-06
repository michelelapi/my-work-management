package com.myworkmanagement.company.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskPartialBillingUpdateDTO {
    @NotNull(message = "Task ID is required")
    private Long taskId;

    @NotBlank(message = "Invoice ID is required")
    private String invoiceId;

    @NotNull(message = "Billing date is required")
    private LocalDate billingDate;
}

package com.myworkmanagement.company.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskBillingStatusUpdateDTO {
    @NotNull(message = "Task ID is required")
    private Long taskId;
    
    @NotNull(message = "Billing status is required")
    private Boolean isBilled;

    @NotNull(message = "Billing date is required")
    private LocalDate billingDate;

    private String invoiceId;
} 
package com.myworkmanagement.company.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskPartialPaymentUpdateDTO {
    @NotNull(message = "Task ID is required")
    private Long taskId;

    @NotNull(message = "Payment date is required")
    private LocalDate paymentDate;
}

package com.myworkmanagement.company.dto;

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
public class TaskDTO {
    private Long id;

    @NotNull(message = "Project ID is required")
    private Long projectId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private String ticketId;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private LocalDate endDate;

    @NotNull(message = "Hours worked is required")
    @Positive(message = "Hours worked must be positive")
    private BigDecimal hoursWorked;

    @Positive(message = "Rate used must be positive")
    private BigDecimal rateUsed;

    private String rateType;
    private String currency;
    private Boolean isBilled;
    private Boolean isPaid;
    private LocalDate billingDate;
    private LocalDate paymentDate;
    private String invoiceId;
    private String notes;

    private String userEmail;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Additional fields for response
    private String projectName;
    private String companyName;
} 
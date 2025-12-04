package com.myworkmanagement.company.dto;

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
@Schema(description = "Task data transfer object")
public class TaskDTO {
    @Schema(description = "Unique identifier of the task", example = "1")
    private Long id;

    @Schema(description = "ID of the project this task belongs to", example = "1", required = true)
    private Long projectId;

    @Schema(description = "Title of the task", example = "Implement user authentication", required = true)
    @NotBlank(message = "Title is required")
    private String title;

    @Schema(description = "Detailed description of the task", example = "Implement JWT-based authentication with refresh tokens")
    private String description;

    @Schema(description = "External ticket or issue tracking ID", example = "JIRA-123")
    private String ticketId;

    @Schema(description = "Date when the task was started", example = "2024-03-20", required = true)
    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @Schema(description = "Date when the task was completed", example = "2024-03-21")
    private LocalDate endDate;

    @Schema(description = "Number of hours worked on the task", example = "8.5", required = true)
    private BigDecimal hoursWorked;

    @Schema(description = "Rate used for billing this task", example = "62.50")
    private BigDecimal rateUsed;

    @Schema(description = "Type of project Evolutiva/Correttiva", example = "Correttiva")
    private String type;

    @Schema(description = "Currency code for the rate", example = "EUR")
    private String currency;

    @Schema(description = "Indicates if the task has been billed", example = "false")
    private Boolean isBilled;

    @Schema(description = "Indicates if the task has been paid", example = "false")
    private Boolean isPaid;

    @Schema(description = "Date when the task was billed", example = "2024-03-25")
    private LocalDate billingDate;

    @Schema(description = "Date when the task was paid", example = "2024-04-01")
    private LocalDate paymentDate;

    @Schema(description = "ID of the invoice for this task", example = "INV-2024-001")
    private String invoiceId;

    @Schema(description = "ID of the referenced task", example = "TSK-2024-ABC123")
    private String referencedTaskId;

    @Schema(description = "Additional notes about the task", example = "Completed ahead of schedule")
    private String notes;

    @Schema(description = "Email of the user who owns/manages this task", example = "user@example.com")
    private String userEmail;

    @Schema(description = "Timestamp when the task was created", example = "2024-03-20T10:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "Timestamp when the task was last updated", example = "2024-03-20T10:00:00")
    private LocalDateTime updatedAt;

    // Additional fields for response
    @Schema(description = "Name of the project this task belongs to", example = "Website Redesign")
    private String projectName;

    @Schema(description = "Name of the company this task belongs to", example = "Example Corp")
    private String companyName;
} 
package com.myworkmanagement.company.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "ticket_id")
    private String ticketId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "hours_worked", nullable = false, precision = 5, scale = 2)
    private BigDecimal hoursWorked;

    @Column(name = "rate_used", precision = 10, scale = 2)
    private BigDecimal rateUsed;

    @Column(name = "rate_type", length = 6)
    private String rateType;

    @Column(length = 3)
    private String currency;

    @Column(name = "is_billed")
    private Boolean isBilled;

    @Column(name = "is_paid")
    private Boolean isPaid;

    @Column(name = "billing_date")
    private LocalDate billingDate;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "invoice_id")
    private String invoiceId;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
} 
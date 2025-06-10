package com.myworkmanagement.company.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyProjectStatsDTO {
    private Long companyId;
    private String companyName;
    private Long projectCount;
    private Long taskCount;
    private Integer totalHours;
    private BigDecimal totalAmount;
} 
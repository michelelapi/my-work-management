package com.myworkmanagement.company.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectCostDTO {
    private String projectName;
    private String month;
    private Double totalCost;
} 
package com.myworkmanagement.company.service;

import com.myworkmanagement.company.dto.CompanyProjectStatsDTO;
import java.util.List;

public interface StatisticsService {
    List<CompanyProjectStatsDTO> getCompanyProjectStats(String userEmail);
} 
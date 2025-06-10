package com.myworkmanagement.company.controller;

import com.myworkmanagement.company.dto.CompanyProjectStatsDTO;
import com.myworkmanagement.company.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'USER')")
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/company-project-stats")
    public ResponseEntity<List<CompanyProjectStatsDTO>> getCompanyProjectStats() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return ResponseEntity.ok(statisticsService.getCompanyProjectStats(userEmail));
    }
} 
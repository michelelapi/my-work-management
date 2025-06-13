package com.myworkmanagement.company.controller;

import com.myworkmanagement.company.dto.CompanyProjectStatsDTO;
import com.myworkmanagement.company.service.StatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Statistics", description = "Statistics and reporting APIs")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'USER')")
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/company-project-stats")
    @Operation(summary = "Get company project statistics", description = "Retrieves statistics about projects and tasks for all companies of the authenticated user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved statistics",
            content = @Content(schema = @Schema(implementation = CompanyProjectStatsDTO.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<List<CompanyProjectStatsDTO>> getCompanyProjectStats() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return ResponseEntity.ok(statisticsService.getCompanyProjectStats(userEmail));
    }
} 
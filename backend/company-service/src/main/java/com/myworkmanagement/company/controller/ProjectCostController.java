package com.myworkmanagement.company.controller;

import com.myworkmanagement.company.dto.ProjectCostDTO;
import com.myworkmanagement.company.service.ProjectCostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Tag(name = "Project Costs", description = "APIs for project cost calculations")
@SecurityRequirement(name = "bearerAuth")
public class ProjectCostController {
    private final ProjectCostService projectCostService;

    @GetMapping("/costs")
    @Operation(summary = "Get project costs by month", description = "Retrieves the total cost (hour_rate * hours_worked) for each project grouped by month")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved project costs"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<ProjectCostDTO>> getProjectCosts() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();

        return ResponseEntity.ok(projectCostService.getProjectCostsByMonth(userEmail));
    }
} 
package com.myworkmanagement.company.controller;

import com.myworkmanagement.company.dto.ActivityReminderCreateDTO;
import com.myworkmanagement.company.dto.ActivityReminderDTO;
import com.myworkmanagement.company.dto.ReminderPreflightResponseDTO;
import com.myworkmanagement.company.service.ActivityReminderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Activity Reminders", description = "Activity-linked reminder APIs")
@SecurityRequirement(name = "bearerAuth")
public class ActivityReminderController {

    private final ActivityReminderService activityReminderService;

    @GetMapping("/reminders/activities")
    @Operation(summary = "Get available activities", description = "Retrieves configured activity names for reminder creation")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved activities"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<String>> getActivities() {
        return ResponseEntity.ok(activityReminderService.getAvailableActivities());
    }

    @GetMapping("/reminders")
    @Operation(summary = "Get reminders", description = "Retrieves reminders for authenticated user; active reminders only by default")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved reminders"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<ActivityReminderDTO>> getReminders(
            Pageable pageable,
            @Parameter(description = "When true, returns only active reminders", example = "true")
            @RequestParam(defaultValue = "true") boolean activeOnly) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return ResponseEntity.ok(activityReminderService.getReminders(userEmail, activeOnly, pageable));
    }

    @PostMapping("/reminders")
    @Operation(summary = "Create reminder", description = "Creates a reminder linked to one activity for authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Reminder created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ActivityReminderDTO> createReminder(@Valid @RequestBody ActivityReminderCreateDTO request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return new ResponseEntity<>(activityReminderService.createReminder(userEmail, request), HttpStatus.CREATED);
    }

    @PatchMapping("/reminders/{id}/complete")
    @Operation(summary = "Complete reminder", description = "Marks reminder as completed for authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Reminder completed successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Reminder not found")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ActivityReminderDTO> completeReminder(
            @Parameter(description = "Reminder id", required = true, example = "1") @PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return ResponseEntity.ok(activityReminderService.completeReminder(userEmail, id));
    }

    @GetMapping("/reminders/preflight")
    @Operation(summary = "Reminder preflight check", description = "Checks whether a reminder popup should be shown before a request")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Preflight check completed"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ReminderPreflightResponseDTO> preflight(
            @Parameter(description = "HTTP method of upcoming request", required = true, example = "GET")
            @RequestParam String method,
            @Parameter(description = "API path of upcoming request", required = true, example = "/tasks/sal/pdf")
            @RequestParam String path) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return ResponseEntity.ok(activityReminderService.checkPreflight(userEmail, method, path));
    }
}

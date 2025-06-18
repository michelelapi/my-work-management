package com.myworkmanagement.company.controller;

import com.myworkmanagement.company.dto.TaskDTO;
import com.myworkmanagement.company.dto.TaskBillingStatusUpdateDTO;
import com.myworkmanagement.company.dto.TaskPaymentStatusUpdateDTO;
import com.myworkmanagement.company.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Task", description = "Task management APIs")
@SecurityRequirement(name = "bearerAuth")
public class TaskController {

    private final TaskService taskService;

    @PostMapping("/projects/{projectId}/tasks")
    @Operation(summary = "Create new task", description = "Creates a new task for a project")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Task created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Project not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<TaskDTO> createTask(
            @Parameter(description = "Unique identifier of the project", required = true, example = "1") @PathVariable Long projectId,
            @Parameter(description = "Task data", required = true, schema = @Schema(implementation = TaskDTO.class))
            @Valid @RequestBody TaskDTO taskDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        taskDTO.setUserEmail(userEmail);
        return new ResponseEntity<>(taskService.createTask(projectId, taskDTO), HttpStatus.CREATED);
    }

    @PutMapping("/projects/{projectId}/tasks/{id}")
    @Operation(summary = "Update task", description = "Updates an existing task")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Task updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Task not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<TaskDTO> updateTask(
            @Parameter(description = "Unique identifier of the project", required = true, example = "1") @PathVariable Long projectId,
            @Parameter(description = "Unique identifier of the task", required = true, example = "1") @PathVariable Long id,
            @Parameter(description = "Updated task data", required = true, schema = @Schema(implementation = TaskDTO.class))
            @Valid @RequestBody TaskDTO taskDTO) {
        return ResponseEntity.ok(taskService.updateTask(id, taskDTO));
    }

    @GetMapping("/tasks/{id}")
    @Operation(summary = "Get task by ID", description = "Retrieves a task by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved task"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Task not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<TaskDTO> getTask(
            @Parameter(description = "Unique identifier of the task", required = true, example = "1") @PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTask(id));
    }

    @GetMapping("/tasks")
    @Operation(summary = "Get all tasks for the authenticated user", description = "Retrieves a paginated list of all tasks for the currently logged-in user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved tasks"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<TaskDTO>> getAllTasks(
            @Parameter(description = "Pagination parameters (page, size, sort)", required = false) Pageable pageable,
            @Parameter(description = "Search term to filter tasks by title, description, or ticket ID", required = false) @RequestParam(required = false) String search) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return ResponseEntity.ok(taskService.getTasksByUserEmail(userEmail, pageable, search));
    }

    @GetMapping("/projects/{projectId}/tasks")
    @Operation(summary = "Get all tasks for a project", description = "Retrieves a paginated list of tasks for a specific project")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved tasks"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Project not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<TaskDTO>> getTasksByProject(
            @Parameter(description = "Unique identifier of the project", required = true, example = "1") @PathVariable Long projectId,
            @Parameter(description = "Pagination parameters (page, size, sort)", required = false) Pageable pageable,
            @Parameter(description = "Search term to filter tasks by title, description, or ticket ID", required = false) @RequestParam(required = false) String search) {
        return ResponseEntity.ok(taskService.getTasksByProject(projectId, pageable, search));
    }

    @GetMapping("/projects/{projectId}/tasks/date-range")
    @Operation(summary = "Get tasks by date range", description = "Retrieves tasks within a date range for a specific project")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved tasks"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Project not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<TaskDTO>> getTasksByProjectAndDateRange(
            @Parameter(description = "Unique identifier of the project", required = true, example = "1") @PathVariable Long projectId,
            @Parameter(description = "Start date of the range (YYYY-MM-DD)", required = true, example = "2024-03-01") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "End date of the range (YYYY-MM-DD)", required = true, example = "2024-03-31") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "Pagination parameters (page, size, sort)", required = false) Pageable pageable) {
        return ResponseEntity.ok(taskService.getTasksByProjectAndDateRange(projectId, startDate, endDate, pageable));
    }

    @GetMapping("/tasks/unbilled")
    @Operation(summary = "Get all unbilled tasks", description = "Retrieves all tasks that have not been billed")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved tasks"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<TaskDTO>> getUnbilledTasks(
            @Parameter(description = "Pagination parameters (page, size, sort)", required = false) Pageable pageable) {
        return ResponseEntity.ok(taskService.getUnbilledTasks(pageable));
    }

    @GetMapping("/tasks/unpaid")
    @Operation(summary = "Get all unpaid tasks", description = "Retrieves all tasks that have not been paid")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved tasks"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<TaskDTO>> getUnpaidTasks(
            @Parameter(description = "Pagination parameters (page, size, sort)", required = false) Pageable pageable) {
        return ResponseEntity.ok(taskService.getUnpaidTasks(pageable));
    }

    @GetMapping("/projects/{projectId}/tasks/unbilled")
    @Operation(summary = "Get unbilled tasks for a project", description = "Retrieves all unbilled tasks for a specific project")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved tasks"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Project not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<TaskDTO>> getUnbilledTasksByProject(
            @Parameter(description = "Unique identifier of the project", required = true, example = "1") @PathVariable Long projectId,
            @Parameter(description = "Pagination parameters (page, size, sort)", required = false) Pageable pageable) {
        return ResponseEntity.ok(taskService.getUnbilledTasksByProject(projectId, pageable));
    }

    @GetMapping("/projects/{projectId}/tasks/unpaid")
    @Operation(summary = "Get unpaid tasks for a project", description = "Retrieves all unpaid tasks for a specific project")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved tasks"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Project not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<TaskDTO>> getUnpaidTasksByProject(
            @Parameter(description = "Unique identifier of the project", required = true, example = "1") @PathVariable Long projectId,
            @Parameter(description = "Pagination parameters (page, size, sort)", required = false) Pageable pageable) {
        return ResponseEntity.ok(taskService.getUnpaidTasksByProject(projectId, pageable));
    }

    @DeleteMapping("/projects/{projectId}/tasks/{id}")
    @Operation(summary = "Delete task", description = "Deletes a task by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Task deleted successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Task not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTask(
            @Parameter(description = "Unique identifier of the project", required = true, example = "1") @PathVariable Long projectId,
            @Parameter(description = "Unique identifier of the task", required = true, example = "1") @PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    // User-specific task endpoints
    @GetMapping("/user/tasks")
    @Operation(summary = "Get all tasks for the authenticated user", description = "Retrieves all tasks for the currently logged-in user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved tasks"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<TaskDTO>> getTasksByUserEmail(
            @Parameter(description = "Pagination parameters (page, size, sort)", required = false) Pageable pageable,
            @Parameter(description = "Search term to filter tasks by title, description, or ticket ID", required = false) @RequestParam(required = false) String search) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return ResponseEntity.ok(taskService.getTasksByUserEmail(userEmail, pageable, search));
    }

    @GetMapping("/user/projects/{projectId}/tasks")
    @Operation(summary = "Get tasks for user and project", description = "Retrieves all tasks for the authenticated user in a specific project")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved tasks"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Project not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<TaskDTO>> getTasksByUserEmailAndProject(
            @Parameter(description = "Unique identifier of the project", required = true, example = "1") @PathVariable Long projectId,
            @Parameter(description = "Pagination parameters (page, size, sort)", required = false) Pageable pageable,
            @Parameter(description = "Search term to filter tasks by title, description, or ticket ID", required = false) @RequestParam(required = false) String search) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return ResponseEntity.ok(taskService.getTasksByUserEmailAndProject(userEmail, projectId, pageable, search));
    }

    @GetMapping("/user/tasks/unbilled")
    @Operation(summary = "Get unbilled tasks for user", description = "Retrieves all unbilled tasks for the authenticated user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved tasks"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<TaskDTO>> getUnbilledTasksByUserEmail(
            @Parameter(description = "Pagination parameters (page, size, sort)", required = false) Pageable pageable) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return ResponseEntity.ok(taskService.getUnbilledTasksByUserEmail(userEmail, pageable));
    }

    @GetMapping("/user/tasks/unpaid")
    @Operation(summary = "Get unpaid tasks for user", description = "Retrieves all unpaid tasks for the authenticated user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved tasks"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<TaskDTO>> getUnpaidTasksByUserEmail(
            @Parameter(description = "Pagination parameters (page, size, sort)", required = false) Pageable pageable) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return ResponseEntity.ok(taskService.getUnpaidTasksByUserEmail(userEmail, pageable));
    }

    @GetMapping("/user/projects/{projectId}/tasks/unbilled")
    @Operation(summary = "Get unbilled tasks for user and project", description = "Retrieves all unbilled tasks for the authenticated user in a specific project")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved tasks"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Project not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<TaskDTO>> getUnbilledTasksByUserEmailAndProject(
            @Parameter(description = "Unique identifier of the project", required = true, example = "1") @PathVariable Long projectId,
            @Parameter(description = "Pagination parameters (page, size, sort)", required = false) Pageable pageable) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return ResponseEntity.ok(taskService.getUnbilledTasksByUserEmailAndProject(userEmail, projectId, pageable));
    }

    @GetMapping("/user/projects/{projectId}/tasks/unpaid")
    @Operation(summary = "Get unpaid tasks for user and project", description = "Retrieves all unpaid tasks for the authenticated user in a specific project")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved tasks"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Project not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<TaskDTO>> getUnpaidTasksByUserEmailAndProject(
            @Parameter(description = "Unique identifier of the project", required = true, example = "1") @PathVariable Long projectId,
            @Parameter(description = "Pagination parameters (page, size, sort)", required = false) Pageable pageable) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return ResponseEntity.ok(taskService.getUnpaidTasksByUserEmailAndProject(userEmail, projectId, pageable));
    }

    @PutMapping("/tasks/billing-status")
    @Operation(summary = "Update billing status for multiple tasks", description = "Updates the billing status for a list of tasks")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tasks updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "One or more tasks not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TaskDTO>> updateTasksBillingStatus(
            @Parameter(description = "List of task IDs and their billing status", required = true)
            @Valid @RequestBody List<TaskBillingStatusUpdateDTO> taskUpdates) {
        return ResponseEntity.ok(taskService.updateTasksBillingStatus(taskUpdates));
    }

    @PutMapping("/tasks/payment-status")
    @Operation(summary = "Update payment status for multiple tasks", description = "Updates the payment status for a list of tasks")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tasks updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "One or more tasks not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TaskDTO>> updateTasksPaymentStatus(
            @Parameter(description = "List of task IDs and their payment status", required = true)
            @Valid @RequestBody List<TaskPaymentStatusUpdateDTO> taskUpdates) {
        return ResponseEntity.ok(taskService.updateTasksPaymentStatus(taskUpdates));
    }
} 
package com.myworkmanagement.company.controller;

import com.myworkmanagement.company.dto.TaskContractUsageDTO;
import com.myworkmanagement.company.dto.TaskDTO;
import com.myworkmanagement.company.dto.TaskBillingStatusUpdateDTO;
import com.myworkmanagement.company.dto.TaskPaymentStatusUpdateDTO;
import com.myworkmanagement.company.entity.Company;
import com.myworkmanagement.company.entity.Project;
import com.myworkmanagement.company.entity.Task;
import com.myworkmanagement.company.entity.TaskContractUsage;
import com.myworkmanagement.company.exception.ResourceNotFoundException;
import com.myworkmanagement.company.entity.Contract;
import com.myworkmanagement.company.entity.ContractStatus;
import com.myworkmanagement.company.repository.CompanyRepository;
import com.myworkmanagement.company.repository.ContractRepository;
import com.myworkmanagement.company.repository.ProjectRepository;
import com.myworkmanagement.company.repository.TaskContractUsageRepository;
import com.myworkmanagement.company.repository.TaskRepository;
import com.myworkmanagement.company.service.SalPdfService;
import com.myworkmanagement.company.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Task", description = "Task management APIs")
@SecurityRequirement(name = "bearerAuth")
public class TaskController {

    private final TaskService taskService;
    private final SalPdfService salPdfService;
    private final CompanyRepository companyRepository;
    private final ContractRepository contractRepository;
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final TaskContractUsageRepository taskContractUsageRepository;

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
            @Parameter(description = "Search term to filter tasks by title, description, or ticket ID", required = false) @RequestParam(required = false) String search,
            @Parameter(description = "Filter by project ID", required = false) @RequestParam(required = false) Long projectId,
            @Parameter(description = "Filter by billing status (true=billed, false=unbilled)", required = false) @RequestParam(required = false) Boolean isBilled,
            @Parameter(description = "Filter by payment status (true=paid, false=unpaid)", required = false) @RequestParam(required = false) Boolean isPaid,
            @Parameter(description = "Filter by task type (EVOLUTIVA, CORRETTIVA)", required = false) @RequestParam(required = false) String type) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return ResponseEntity.ok(taskService.getTasksByUserEmail(userEmail, pageable, search, projectId, isBilled, isPaid, type));
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
            @Parameter(description = "Search term to filter tasks by title, description, or ticket ID", required = false) @RequestParam(required = false) String search,
            @Parameter(description = "Filter by billing status (true=billed, false=unbilled)", required = false) @RequestParam(required = false) Boolean isBilled,
            @Parameter(description = "Filter by payment status (true=paid, false=unpaid)", required = false) @RequestParam(required = false) Boolean isPaid,
            @Parameter(description = "Filter by task type (EVOLUTIVA, CORRETTIVA)", required = false) @RequestParam(required = false) String type) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return ResponseEntity.ok(taskService.getTasksByProject(projectId, pageable, search, isBilled, isPaid, userEmail, type));
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
    @PreAuthorize("hasRole('ADMIN','USER')")
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
    @PreAuthorize("hasRole('ADMIN','USER')")
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
    @PreAuthorize("hasRole('ADMIN','USER')")
    public ResponseEntity<List<TaskDTO>> updateTasksPaymentStatus(
            @Parameter(description = "List of task IDs and their payment status", required = true)
            @Valid @RequestBody List<TaskPaymentStatusUpdateDTO> taskUpdates) {
        return ResponseEntity.ok(taskService.updateTasksPaymentStatus(taskUpdates));
    }

    @GetMapping("/tasks/sal/pdf")
    @Operation(summary = "Generate SAL PDF for Dedagroup", description = "Generates a formal SAL PDF document for the specified month/year")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "PDF generated successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<byte[]> generateSalPdf(
            @Parameter(description = "Year for the report", required = true, example = "2025") @RequestParam Integer year,
            @Parameter(description = "Month for the report (1-12)", required = true, example = "11") @RequestParam Integer month,
            @Parameter(description = "Project ID to filter tasks (optional)", required = false) @RequestParam(required = false) Long projectId,
            @Parameter(description = "Specific task IDs to include (optional, if omitted all matching tasks are included)", required = false) @RequestParam(required = false) List<Long> taskIds,
            @Parameter(description = "Contract ID to cap SAL amounts (optional, auto-detects first OPEN contract if omitted)", required = false) @RequestParam(required = false) Long contractId,
            @Parameter(description = "User name for the document", required = false) @RequestParam(required = false) String userName,
            @Parameter(description = "User address for the document", required = false) @RequestParam(required = false) String userAddress,
            @Parameter(description = "User phone for the document", required = false) @RequestParam(required = false) String userPhone,
            @Parameter(description = "User email for the document", required = false) @RequestParam(required = false) String userEmailAddress,
            @Parameter(description = "Project name for the document", required = false) @RequestParam(required = false) String projectName) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();
            
            LocalDate startDate = LocalDate.of(year, month, 1);
            LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
            LocalDate reportMonth = startDate;
            
            Company dedagroupCompany = companyRepository.findByName("Dedagroup")
                .orElseThrow(() -> new ResourceNotFoundException("Company 'Dedagroup' not found"));
            
            List<TaskDTO> tasks;
            if (taskIds != null && !taskIds.isEmpty()) {
                List<Task> selectedTasks = taskRepository.findAllById(taskIds);
                tasks = selectedTasks.stream()
                    .filter(t -> t.getUserEmail().equals(userEmail))
                    .map(this::convertTaskToDTO)
                    .collect(java.util.stream.Collectors.toList());
            } else if (projectId != null) {
                Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
                
                if (!dedagroupCompany.getId().equals(project.getCompany().getId())) {
                    throw new IllegalArgumentException("Project does not belong to Dedagroup company");
                }
                
                List<Task> projectTasks = taskRepository.findByProjectIdAndStartDateBetween(
                    projectId, startDate, endDate, 
                    org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE)).getContent();
                
                tasks = projectTasks.stream()
                    .map(this::convertTaskToDTO)
                    .collect(java.util.stream.Collectors.toList());
            } else {
                List<Task> dedagroupTasks = taskRepository.findByUserEmailAndCompanyIdAndDateRange(
                    userEmail, dedagroupCompany.getId(), startDate, endDate);
                
                tasks = dedagroupTasks.stream()
                    .map(this::convertTaskToDTO)
                    .collect(java.util.stream.Collectors.toList());
            }

            if (tasks.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            if (userName == null || userName.isEmpty()) {
                userName = userEmail.split("@")[0];
            }
            if (userEmailAddress == null || userEmailAddress.isEmpty()) {
                userEmailAddress = userEmail;
            }

            Map<Contract, List<TaskDTO>> allocations = allocateTasksToContracts(tasks, contractId);

            if (allocations.size() <= 1) {
                Map.Entry<Contract, List<TaskDTO>> single = allocations.entrySet().iterator().next();
                Contract contract = single.getKey();
                List<TaskDTO> salTasks = single.getValue();
                BigDecimal remainingAfterSal = computeRemainingAfterSal(contract, salTasks);
                byte[] pdfBytes = salPdfService.generateSalPdf(salTasks, userEmail, userName,
                    userAddress, userPhone, userEmailAddress, projectName, reportMonth,
                    contract != null ? contract.getCode() : null, remainingAfterSal);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_PDF);
                headers.setContentDispositionFormData("attachment",
                    String.format("SAL_%d_%02d.pdf", year, month));
                return ResponseEntity.ok().headers(headers).body(pdfBytes);
            }

            ByteArrayOutputStream zipBaos = new ByteArrayOutputStream();
            ZipOutputStream zipOut = new ZipOutputStream(zipBaos);

            for (Map.Entry<Contract, List<TaskDTO>> entry : allocations.entrySet()) {
                Contract contract = entry.getKey();
                List<TaskDTO> salTasks = entry.getValue();
                BigDecimal remainingAfterSal = computeRemainingAfterSal(contract, salTasks);

                byte[] pdfBytes = salPdfService.generateSalPdf(salTasks, userEmail, userName,
                    userAddress, userPhone, userEmailAddress, projectName, reportMonth,
                    contract != null ? contract.getCode() : null, remainingAfterSal);

                String contractCode = contract != null ? contract.getCode() : "no-contract";
                String entryName = String.format("SAL_%d_%02d_%s.pdf", year, month, contractCode);
                zipOut.putNextEntry(new ZipEntry(entryName));
                zipOut.write(pdfBytes);
                zipOut.closeEntry();
            }

            zipOut.finish();
            zipOut.close();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/zip"));
            headers.setContentDispositionFormData("attachment",
                String.format("SAL_%d_%02d.zip", year, month));
            return ResponseEntity.ok().headers(headers).body(zipBaos.toByteArray());

        } catch (Exception e) {
            log.error("Error generating SAL PDF", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Allocates tasks across OPEN contracts for the project.
     * Tasks are processed in order. When a contract's budget is exhausted, the
     * overflowing task is split: the portion that fits stays with the current contract,
     * and the remainder moves to the next OPEN contract.
     * Returns a map of Contract -> task list (preserving contract order).
     * If no contracts exist, returns a single entry with null key and all tasks uncapped.
     */
    private Map<Contract, List<TaskDTO>> allocateTasksToContracts(List<TaskDTO> tasks, Long contractId) {
        Map<Contract, List<TaskDTO>> allocations = new LinkedHashMap<>();

        List<Contract> openContracts;
        if (contractId != null) {
            Contract c = contractRepository.findById(contractId).orElse(null);
            openContracts = c != null ? List.of(c) : List.of();
        } else {
            Long taskProjectId = tasks.get(0).getProjectId();
            openContracts = contractRepository.findByProjectIdAndStatus(
                taskProjectId, ContractStatus.OPEN);
        }

        if (openContracts.isEmpty()) {
            allocations.put(null, tasks);
            return allocations;
        }

        List<TaskDTO> remainingTasks = new ArrayList<>(tasks);

        for (Contract contract : openContracts) {
            if (remainingTasks.isEmpty()) break;

            BigDecimal availableAmount = contract.getAmountAvailable();
            if (availableAmount == null || availableAmount.compareTo(BigDecimal.ZERO) <= 0) continue;

            List<TaskDTO> contractTasks = new ArrayList<>();
            List<TaskDTO> nextRemaining = new ArrayList<>();
            BigDecimal runningTotal = BigDecimal.ZERO;
            boolean budgetExhausted = false;

            for (TaskDTO task : remainingTasks) {
                if (budgetExhausted) {
                    nextRemaining.add(task);
                    continue;
                }

                BigDecimal hours = task.getHoursWorked() != null ? task.getHoursWorked() : BigDecimal.ZERO;
                BigDecimal rate = task.getRateUsed() != null ? task.getRateUsed() : BigDecimal.ZERO;
                BigDecimal taskCost = hours.multiply(rate);
                BigDecimal newTotal = runningTotal.add(taskCost);

                if (newTotal.compareTo(availableAmount) <= 0) {
                    contractTasks.add(task);
                    runningTotal = newTotal;
                } else {
                    BigDecimal remaining = availableAmount.subtract(runningTotal);
                    if (remaining.compareTo(BigDecimal.ZERO) > 0 && rate.compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal adjustedHours = remaining.divide(rate, 2, RoundingMode.HALF_UP);
                        contractTasks.add(copyTaskWithAdjustedHours(task, adjustedHours, remaining));

                        BigDecimal spillHours = hours.subtract(adjustedHours);
                        if (spillHours.compareTo(BigDecimal.ZERO) > 0) {
                            BigDecimal spillAmount = taskCost.subtract(remaining);
                            nextRemaining.add(copyTaskWithAdjustedHours(task, spillHours, spillAmount));
                        }
                    } else {
                        nextRemaining.add(task);
                    }
                    budgetExhausted = true;
                }
            }

            if (!contractTasks.isEmpty()) {
                allocations.put(contract, contractTasks);
            }
            remainingTasks = nextRemaining;
        }

        if (!remainingTasks.isEmpty() && !allocations.isEmpty()) {
            Contract lastContract = null;
            for (Contract c : allocations.keySet()) lastContract = c;
            allocations.get(lastContract).addAll(remainingTasks);
        } else if (!remainingTasks.isEmpty()) {
            allocations.put(null, remainingTasks);
        }

        return allocations;
    }

    private BigDecimal computeRemainingAfterSal(Contract contract, List<TaskDTO> salTasks) {
        if (contract == null) return null;
        BigDecimal salTotal = BigDecimal.ZERO;
        for (TaskDTO t : salTasks) {
            salTotal = salTotal.add(resolveBillableAmount(t));
        }
        BigDecimal remaining = contract.getAmountAvailable().subtract(salTotal);
        return remaining.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : remaining;
    }

    private BigDecimal resolveBillableAmount(TaskDTO task) {
        if (task.getBillableAmount() != null) {
            return task.getBillableAmount();
        }
        BigDecimal h = task.getHoursWorked() != null ? task.getHoursWorked() : BigDecimal.ZERO;
        BigDecimal r = task.getRateUsed() != null ? task.getRateUsed() : BigDecimal.ZERO;
        return h.multiply(r);
    }

    private TaskDTO copyTaskWithAdjustedHours(TaskDTO task, BigDecimal adjustedHours, BigDecimal billableAmount) {
        return TaskDTO.builder()
            .id(task.getId())
            .projectId(task.getProjectId())
            .projectName(task.getProjectName())
            .companyName(task.getCompanyName())
            .title(task.getTitle())
            .description(task.getDescription())
            .ticketId(task.getTicketId())
            .startDate(task.getStartDate())
            .endDate(task.getEndDate())
            .hoursWorked(adjustedHours)
            .billableAmount(billableAmount)
            .rateUsed(task.getRateUsed())
            .type(task.getType())
            .currency(task.getCurrency())
            .isBilled(task.getIsBilled())
            .isPaid(task.getIsPaid())
            .billingDate(task.getBillingDate())
            .paymentDate(task.getPaymentDate())
            .invoiceId(task.getInvoiceId())
            .referencedTaskId(task.getReferencedTaskId())
            .clientId(task.getClientId())
            .clientName(task.getClientName())
            .notes(task.getNotes())
            .userEmail(task.getUserEmail())
            .createdAt(task.getCreatedAt())
            .updatedAt(task.getUpdatedAt())
            .contractUsages(task.getContractUsages())
            .build();
    }

    private TaskDTO convertTaskToDTO(Task task) {
        List<TaskContractUsage> usages = taskContractUsageRepository.findByTaskId(task.getId());
        List<TaskContractUsageDTO> usageDTOs = usages != null && !usages.isEmpty()
                ? usages.stream()
                    .map(u -> TaskContractUsageDTO.builder()
                            .contractId(u.getContract().getId())
                            .contractCode(u.getContractCode())
                            .amountUsed(u.getAmountUsed())
                            .build())
                    .collect(java.util.stream.Collectors.toList())
                : null;

        return TaskDTO.builder()
                .id(task.getId())
                .projectId(task.getProject().getId())
                .projectName(task.getProject().getName())
                .companyName(task.getProject().getCompany().getName())
                .title(task.getTitle())
                .description(task.getDescription())
                .ticketId(task.getTicketId())
                .startDate(task.getStartDate())
                .endDate(task.getEndDate())
                .hoursWorked(task.getHoursWorked())
                .rateUsed(task.getRateUsed())
                .type(task.getType())
                .currency(task.getCurrency())
                .isBilled(task.getIsBilled())
                .isPaid(task.getIsPaid())
                .billingDate(task.getBillingDate())
                .paymentDate(task.getPaymentDate())
                .invoiceId(task.getInvoiceId())
                .referencedTaskId(task.getReferencedTaskId())
                .clientId(task.getClient() != null ? task.getClient().getId() : null)
                .clientName(task.getClient() != null ? task.getClient().getName() : null)
                .notes(task.getNotes())
                .userEmail(task.getUserEmail())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .contractUsages(usageDTOs)
                .build();
    }
} 
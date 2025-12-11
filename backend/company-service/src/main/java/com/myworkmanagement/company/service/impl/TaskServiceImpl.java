package com.myworkmanagement.company.service.impl;

import com.myworkmanagement.company.dto.TaskBillingStatusUpdateDTO;
import com.myworkmanagement.company.dto.TaskDTO;
import com.myworkmanagement.company.dto.TaskPaymentStatusUpdateDTO;
import com.myworkmanagement.company.entity.Project;
import com.myworkmanagement.company.entity.Task;
import com.myworkmanagement.company.exception.ResourceNotFoundException;
import com.myworkmanagement.company.exception.TaskBillingStatusException;
import com.myworkmanagement.company.exception.TaskPaymentStatusException;
import com.myworkmanagement.company.repository.ProjectRepository;
import com.myworkmanagement.company.repository.TaskRepository;
import com.myworkmanagement.company.service.GoogleSheetsService;
import com.myworkmanagement.company.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final GoogleSheetsService googleSheetsService;
    private static final Logger logger = LoggerFactory.getLogger(TaskServiceImpl.class);
    private static final SecureRandom random = new SecureRandom();
    private static final String ALPHANUMERIC_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    @Override
    @Transactional
    public TaskDTO createTask(Long projectId, TaskDTO taskDTO) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        // Generate random task ID if not provided
        String ticketId = taskDTO.getTicketId();
        if (ticketId == null || ticketId.trim().isEmpty()) {
            ticketId = generateRandomTaskId();
            taskDTO.setTicketId(ticketId);
        }

        // Set default values if not provided
        String type = taskDTO.getType();
        if (type == null || type.trim().isEmpty()) {
            type = "CORRETTIVA";
            taskDTO.setType(type);
        }
        
        String currency = taskDTO.getCurrency();
        if (currency == null || currency.trim().isEmpty()) {
            currency = "EUR";
            taskDTO.setCurrency(currency);
        }

        Task task = Task.builder()
                .project(project)
                .title(taskDTO.getTitle())
                .description(taskDTO.getDescription())
                .ticketId(ticketId)
                .startDate(taskDTO.getStartDate())
                .endDate(taskDTO.getEndDate())
                .hoursWorked(taskDTO.getHoursWorked())
                .rateUsed(taskDTO.getRateUsed())
                .type(type)
                .currency(currency)
                .isBilled(taskDTO.getIsBilled())
                .isPaid(taskDTO.getIsPaid())
                .billingDate(taskDTO.getBillingDate())
                .paymentDate(taskDTO.getPaymentDate())
                .invoiceId(taskDTO.getInvoiceId())
                .referencedTaskId(taskDTO.getReferencedTaskId())
                .notes(taskDTO.getNotes())
                .userEmail(taskDTO.getUserEmail())
                .build();

        Task savedTask = taskRepository.save(task);
        // Sync to Google Sheets
        try {
            googleSheetsService.addTaskRow(mapTaskToSheetRow(savedTask));
        } catch (Exception e) {
            logger.error("Failed to add task to Google Sheets: {}", e.getMessage());
        }
        return convertToDTO(savedTask);
    }

    @Override
    @Transactional
    public TaskDTO updateTask(Long id, TaskDTO taskDTO) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        Project project = projectRepository.findById(taskDTO.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + taskDTO.getProjectId()));

        task.setProject(project);
        task.setTitle(taskDTO.getTitle());
        task.setDescription(taskDTO.getDescription());
        task.setTicketId(taskDTO.getTicketId());
        task.setStartDate(taskDTO.getStartDate());
        task.setEndDate(taskDTO.getEndDate());
        task.setHoursWorked(taskDTO.getHoursWorked());
        task.setRateUsed(taskDTO.getRateUsed());
        task.setType(taskDTO.getType());
        task.setCurrency(taskDTO.getCurrency());
        task.setIsBilled(taskDTO.getIsBilled());
        task.setIsPaid(taskDTO.getIsPaid());
        task.setBillingDate(taskDTO.getBillingDate());
        task.setPaymentDate(taskDTO.getPaymentDate());
        task.setInvoiceId(taskDTO.getInvoiceId());
        task.setReferencedTaskId(taskDTO.getReferencedTaskId());
        task.setNotes(taskDTO.getNotes());
        task.setUserEmail(taskDTO.getUserEmail());

        Task updatedTask = taskRepository.save(task);
        // Sync to Google Sheets
        try {
            googleSheetsService.updateTaskRowByTicketId(updatedTask.getTicketId(), mapTaskToSheetRow(updatedTask));
        } catch (Exception e) {
            logger.error("Failed to update task in Google Sheets: {}", e.getMessage());
        }
        return convertToDTO(updatedTask);
    }

    @Override
    @Transactional(readOnly = true)
    public TaskDTO getTask(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        return convertToDTO(task);
    }

    @Override
    @Transactional
    public void deleteTask(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        String ticketId = task.getTicketId();
        // Delete from DB first
        taskRepository.deleteById(id);
        // Sync to Google Sheets
        try {
            if (ticketId != null && !ticketId.isEmpty()) {
                googleSheetsService.deleteTaskRowByTicketId(ticketId);
            }
        } catch (Exception e) {
            logger.error("Failed to delete task from Google Sheets: {}", e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskDTO> getTasksByUserEmail(String userEmail, Pageable pageable, String search) {
        if (search != null && !search.trim().isEmpty()) {
            String searchTerm = search.toLowerCase();
            return taskRepository.findByUserEmailAndSearch(userEmail, searchTerm, searchTerm, searchTerm, searchTerm, pageable)
                    .map(this::convertToDTO);
        } else {
            return taskRepository.findByUserEmail(userEmail, pageable)
                    .map(this::convertToDTO);
        }
    }

    // Not used in TaskController - controller uses the 7-parameter version with 'type' parameter
    // @Override
    // @Transactional(readOnly = true)
    // public Page<TaskDTO> getTasksByUserEmail(String userEmail, Pageable pageable, String search, Long projectId, Boolean isBilled, Boolean isPaid) {
    //     return getTasksByUserEmail(userEmail, pageable, search, projectId, isBilled, isPaid, null);
    // }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskDTO> getTasksByUserEmail(String userEmail, Pageable pageable, String search, Long projectId, Boolean isBilled, Boolean isPaid, String type) {
        Page<Task> tasks;
        
        // If no filters, use standard method
        if (projectId == null && isBilled == null && isPaid == null && type == null) {
            return getTasksByUserEmail(userEmail, pageable, search);
        }
        
        // Check if we need to apply in-memory filters
        boolean needsInMemoryFiltering = (isBilled != null) || (isPaid != null) || (type != null && !type.trim().isEmpty());
        
        if (needsInMemoryFiltering) {
            // Fetch all matching tasks first (without pagination), then filter and paginate
            Pageable allResultsPageable = org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE);
            
            // Start with base query
            if (projectId != null) {
                // With project filter
                if (search != null && !search.trim().isEmpty()) {
                    String searchTerm = search.toLowerCase();
                    tasks = taskRepository.findByUserEmailAndFilters(userEmail, projectId, type, isBilled, isPaid, searchTerm, allResultsPageable);
                } else {
                    tasks = taskRepository.findByUserEmailAndProjectId(userEmail, projectId, allResultsPageable);
                }
            } else {
                // Without project filter
                if (search != null && !search.trim().isEmpty()) {
                    String searchTerm = search.toLowerCase();
                    tasks = taskRepository.findByUserEmailAndSearch(userEmail, searchTerm, searchTerm, searchTerm, searchTerm, allResultsPageable);
                } else {
                    tasks = taskRepository.findByUserEmail(userEmail, allResultsPageable);
                }
            }
            
            // Apply status and type filters
            List<Task> filteredContent = tasks.getContent();
            if (isBilled != null) {
                filteredContent = filteredContent.stream()
                    .filter(t -> isBilled.equals(t.getIsBilled()))
                    .collect(Collectors.toList());
            }
            if (isPaid != null) {
                filteredContent = filteredContent.stream()
                    .filter(t -> isPaid.equals(t.getIsPaid()))
                    .collect(Collectors.toList());
            }
            if (type != null && !type.trim().isEmpty()) {
                filteredContent = filteredContent.stream()
                    .filter(t -> type.equals(t.getType()))
                    .collect(Collectors.toList());
            }
            
            // Apply pagination to filtered results
            int pageSize = pageable.getPageSize();
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageSize), filteredContent.size());
            List<Task> paginatedContent = start < filteredContent.size() 
                ? filteredContent.subList(start, end) 
                : new ArrayList<>();
            
            // Create new page with filtered and paginated content
            tasks = new org.springframework.data.domain.PageImpl<>(
                paginatedContent,
                pageable,
                filteredContent.size()
            );
        } else {
            // No in-memory filtering needed, use standard pagination
            if (projectId != null) {
                // With project filter
                if (search != null && !search.trim().isEmpty()) {
                    String searchTerm = search.toLowerCase();
                    tasks = taskRepository.findByUserEmailAndFilters(userEmail, projectId, type, isBilled, isPaid, searchTerm, pageable);
                } else {
                    tasks = taskRepository.findByUserEmailAndProjectId(userEmail, projectId, pageable);
                }
            } else {
                // Without project filter
                if (search != null && !search.trim().isEmpty()) {
                    String searchTerm = search.toLowerCase();
                    tasks = taskRepository.findByUserEmailAndSearch(userEmail, searchTerm, searchTerm, searchTerm, searchTerm, pageable);
                } else {
                    tasks = taskRepository.findByUserEmail(userEmail, pageable);
                }
            }
        }
        
        return tasks.map(this::convertToDTO);
    }

    // Not used in TaskController - controller uses the 7-parameter version with all filters
    // @Override
    // @Transactional(readOnly = true)
    // public Page<TaskDTO> getTasksByProject(Long projectId, Pageable pageable, String search) {
    //     if (search != null && !search.trim().isEmpty()) {
    //         String searchTerm = search.toLowerCase();
    //         return taskRepository.findByProjectIdAndTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrTicketIdContainingIgnoreCase(projectId, searchTerm, searchTerm, searchTerm, pageable)
    //                 .map(this::convertToDTO);
    //     } else {
    //         return taskRepository.findByProjectId(projectId, pageable)
    //                 .map(this::convertToDTO);
    //     }
    // }

    // Not used in TaskController - controller uses the 7-parameter version with 'type' parameter
    // @Override
    // @Transactional(readOnly = true)
    // public Page<TaskDTO> getTasksByProject(Long projectId, Pageable pageable, String search, Boolean isBilled, Boolean isPaid, String userEmail) {
    //     return getTasksByProject(projectId, pageable, search, isBilled, isPaid, userEmail, null);
    // }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskDTO> getTasksByProject(Long projectId, Pageable pageable, String search, Boolean isBilled, Boolean isPaid, String userEmail, String type) {
        // Check if we need to apply in-memory filters
        boolean needsInMemoryFiltering = (isBilled != null) || (isPaid != null) || (type != null && !type.trim().isEmpty());
        
        Page<Task> tasks;
        
        if (needsInMemoryFiltering) {
            // Fetch all matching tasks first (without pagination), then filter and paginate
            Pageable allResultsPageable = org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE);
            
            // Start with base query - filter by user email and project
            if (search != null && !search.trim().isEmpty()) {
                String searchTerm = search.toLowerCase();
                tasks = taskRepository.findByUserEmailAndFilters(userEmail, projectId, type, isBilled, isPaid, searchTerm, allResultsPageable);
            } else {
                tasks = taskRepository.findByUserEmailAndProjectId(userEmail, projectId, allResultsPageable);
            }
            
            // Apply status and type filters
            List<Task> filteredContent = tasks.getContent();
            if (isBilled != null) {
                filteredContent = filteredContent.stream()
                    .filter(t -> isBilled.equals(t.getIsBilled()))
                    .collect(Collectors.toList());
            }
            if (isPaid != null) {
                filteredContent = filteredContent.stream()
                    .filter(t -> isPaid.equals(t.getIsPaid()))
                    .collect(Collectors.toList());
            }
            if (type != null && !type.trim().isEmpty()) {
                filteredContent = filteredContent.stream()
                    .filter(t -> type.equals(t.getType()))
                    .collect(Collectors.toList());
            }
            
            // Apply pagination to filtered results
            int pageSize = pageable.getPageSize();
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageSize), filteredContent.size());
            List<Task> paginatedContent = start < filteredContent.size() 
                ? filteredContent.subList(start, end) 
                : new ArrayList<>();
            
            // Create new page with filtered and paginated content
            Page<Task> filteredTasks = new org.springframework.data.domain.PageImpl<>(
                paginatedContent,
                pageable,
                filteredContent.size()
            );
            
            return filteredTasks.map(this::convertToDTO);
        } else {
            // No in-memory filtering needed, use standard pagination
            if (search != null && !search.trim().isEmpty()) {
                String searchTerm = search.toLowerCase();
                tasks = taskRepository.findByUserEmailAndFilters(userEmail, projectId, type, isBilled, isPaid, searchTerm, pageable);
            } else {
                tasks = taskRepository.findByUserEmailAndProjectId(userEmail, projectId, pageable);
            }
            return tasks.map(this::convertToDTO);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskDTO> getTasksByProjectAndDateRange(Long projectId, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        return taskRepository.findByProjectIdAndStartDateBetween(projectId, startDate, endDate, pageable)
                .map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskDTO> getUnbilledTasks(Pageable pageable) {
        return taskRepository.findByIsBilledFalse(pageable)
                .map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskDTO> getUnpaidTasks(Pageable pageable) {
        return taskRepository.findByIsPaidFalse(pageable)
                .map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskDTO> getUnbilledTasksByProject(Long projectId, Pageable pageable) {
        return taskRepository.findByProjectIdAndIsBilledFalse(projectId, pageable)
                .map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskDTO> getUnpaidTasksByProject(Long projectId, Pageable pageable) {
        return taskRepository.findByProjectIdAndIsPaidFalse(projectId, pageable)
                .map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskDTO> getTasksByUserEmailAndProject(String userEmail, Long projectId, Pageable pageable, String search) {
        if (search != null && !search.trim().isEmpty()) {
            String searchTerm = search.toLowerCase();
            return taskRepository.findByUserEmailAndFilters(userEmail, projectId, null, null, null, searchTerm, pageable)
                    .map(this::convertToDTO);
        } else {
            return taskRepository.findByUserEmailAndProjectId(userEmail, projectId, pageable)
                    .map(this::convertToDTO);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskDTO> getUnbilledTasksByUserEmail(String userEmail, Pageable pageable) {
        return taskRepository.findByUserEmailAndIsBilledFalse(userEmail, pageable)
                .map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskDTO> getUnpaidTasksByUserEmail(String userEmail, Pageable pageable) {
        return taskRepository.findByUserEmailAndIsPaidFalse(userEmail, pageable)
                .map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskDTO> getUnbilledTasksByUserEmailAndProject(String userEmail, Long projectId, Pageable pageable) {
        return taskRepository.findByUserEmailAndProjectIdAndIsBilledFalse(userEmail, projectId, pageable)
                .map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskDTO> getUnpaidTasksByUserEmailAndProject(String userEmail, Long projectId, Pageable pageable) {
        return taskRepository.findByUserEmailAndProjectIdAndIsPaidFalse(userEmail, projectId, pageable)
                .map(this::convertToDTO);
    }

    @Override
    @Transactional
    public List<TaskDTO> updateTasksBillingStatus(List<TaskBillingStatusUpdateDTO> taskUpdates) {
        List<TaskDTO> updatedTasks = new ArrayList<>();

        for (TaskBillingStatusUpdateDTO update : taskUpdates) {
            Task task = taskRepository.findById(update.getTaskId())
                .orElseThrow(() -> new TaskBillingStatusException("Task not found with id: " + update.getTaskId()));
            
            task.setIsBilled(update.getIsBilled());
            task.setBillingDate(update.getIsBilled()?update.getBillingDate():null);
            task.setInvoiceId(update.getIsBilled()?update.getInvoiceId():null);
            Task savedTask = taskRepository.save(task);
            updatedTasks.add(convertToDTO(savedTask));

            googleSheetsService.updateTaskRowByTicketId(savedTask.getTicketId(), mapTaskToSheetRow(savedTask))
            .exceptionally(ex -> {
                logger.error("Failed to update task in Google Sheets: {}", ex.getMessage());
                return null;
            });
        }


        return updatedTasks;
    }

    @Override
    @Transactional
    public List<TaskDTO> updateTasksPaymentStatus(List<TaskPaymentStatusUpdateDTO> taskUpdates) {
        List<TaskDTO> updatedTasks = new ArrayList<>();
        
        for (TaskPaymentStatusUpdateDTO update : taskUpdates) {
            Task task = taskRepository.findById(update.getTaskId())
                .orElseThrow(() -> new TaskPaymentStatusException("Task not found with id: " + update.getTaskId()));
            
            task.setIsPaid(update.getIsPaid());
            task.setPaymentDate(update.getIsPaid()?update.getPaymentDate():null);
            Task savedTask = taskRepository.save(task);
            updatedTasks.add(convertToDTO(savedTask));

            googleSheetsService.updateTaskRowByTicketId(savedTask.getTicketId(), mapTaskToSheetRow(savedTask))
            .exceptionally(ex -> {
                logger.error("Failed to update task in Google Sheets: {}", ex.getMessage());
                return null;
            });
        }
        
        return updatedTasks;
    }

    private TaskDTO convertToDTO(Task task) {
        return TaskDTO.builder()
                .id(task.getId())
                .projectId(task.getProject().getId())
                .projectName(task.getProject().getName())
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
                .notes(task.getNotes())
                .userEmail(task.getUserEmail())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }

    private List<Object> mapTaskToSheetRow(Task task) {
        return Arrays.asList(
                task.getStartDate() != null ? task.getStartDate().toString() : "",
                task.getEndDate() != null ? task.getEndDate().toString() : "",
                task.getTicketId() != null ? task.getTicketId() : "",
                task.getTitle() != null ? task.getTitle() : "",
                task.getProject() != null ? task.getProject().getName() : "",
                task.getHoursWorked() != null ? task.getHoursWorked().toString() : "",
                task.getIsBilled() != null ? task.getIsBilled().toString() : "",
                task.getIsPaid() != null ? task.getIsPaid().toString() : "",
                task.getBillingDate() != null ? task.getBillingDate().toString() : "",
                task.getPaymentDate() != null ? task.getPaymentDate().toString() : "",
                task.getInvoiceId() != null ? task.getInvoiceId() : ""
        );
    }

    /**
     * Generates a random alphanumeric task ID in the format: TSK-YYYY-XXXXXX
     * where YYYY is the current year and XXXXXX is 6 random alphanumeric characters
     */
    private String generateRandomTaskId() {
        String year = String.valueOf(Year.now().getValue());
        int attempts = 0;
        
        while (attempts < 10) {
            StringBuilder randomPart = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                randomPart.append(ALPHANUMERIC_CHARS.charAt(random.nextInt(ALPHANUMERIC_CHARS.length())));
            }
            final String candidateTaskId = "TSK-" + year + "-" + randomPart.toString();
            
            // Check if ticketId already exists
            boolean exists = taskRepository.findAll().stream()
                    .anyMatch(t -> candidateTaskId.equals(t.getTicketId()));
            
            if (!exists) {
                return candidateTaskId;
            }
            attempts++;
        }
        
        // Fallback if all attempts failed (very unlikely)
        return "TSK-" + year + "-" + String.valueOf(System.currentTimeMillis()).substring(7);
    }
} 
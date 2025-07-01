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

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final GoogleSheetsService googleSheetsService;
    private static final Logger logger = LoggerFactory.getLogger(TaskServiceImpl.class);

    @Override
    @Transactional
    public TaskDTO createTask(Long projectId, TaskDTO taskDTO) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        Task task = Task.builder()
                .project(project)
                .title(taskDTO.getTitle())
                .description(taskDTO.getDescription())
                .ticketId(taskDTO.getTicketId())
                .startDate(taskDTO.getStartDate())
                .endDate(taskDTO.getEndDate())
                .hoursWorked(taskDTO.getHoursWorked())
                .rateUsed(taskDTO.getRateUsed())
                .type(taskDTO.getType())
                .currency(taskDTO.getCurrency())
                .isBilled(taskDTO.getIsBilled())
                .isPaid(taskDTO.getIsPaid())
                .billingDate(taskDTO.getBillingDate())
                .paymentDate(taskDTO.getPaymentDate())
                .invoiceId(taskDTO.getInvoiceId())
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
    @Transactional(readOnly = true)
    public List<TaskDTO> getAllTasks() {
        return taskRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByProject(Long projectId) {
        return taskRepository.findByProjectId(projectId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByProjectAndDateRange(Long projectId, LocalDate startDate, LocalDate endDate) {
        return taskRepository.findByProjectIdAndStartDateBetween(projectId, startDate, endDate).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getUnbilledTasks() {
        return taskRepository.findByIsBilledFalse().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getUnpaidTasks() {
        return taskRepository.findByIsPaidFalse().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getUnbilledTasksByProject(Long projectId) {
        return taskRepository.findByProjectIdAndIsBilledFalse(projectId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getUnpaidTasksByProject(Long projectId) {
        return taskRepository.findByProjectIdAndIsPaidFalse(projectId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
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

    // New methods for user email filtering
    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByUserEmail(String userEmail) {
        return taskRepository.findByUserEmail(userEmail).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByUserEmailAndProject(String userEmail, Long projectId) {
        return taskRepository.findByUserEmailAndProjectId(userEmail, projectId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getUnbilledTasksByUserEmail(String userEmail) {
        return taskRepository.findByUserEmailAndIsBilledFalse(userEmail).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getUnpaidTasksByUserEmail(String userEmail) {
        return taskRepository.findByUserEmailAndIsPaidFalse(userEmail).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getUnbilledTasksByUserEmailAndProject(String userEmail, Long projectId) {
        return taskRepository.findByUserEmailAndProjectIdAndIsBilledFalse(userEmail, projectId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getUnpaidTasksByUserEmailAndProject(String userEmail, Long projectId) {
        return taskRepository.findByUserEmailAndProjectIdAndIsPaidFalse(userEmail, projectId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
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

    @Override
    @Transactional(readOnly = true)
    public Page<TaskDTO> getTasksByProject(Long projectId, Pageable pageable, String search) {
        if (search != null && !search.trim().isEmpty()) {
            String searchTerm = search.toLowerCase();
            return taskRepository.findByProjectIdAndTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrTicketIdContainingIgnoreCase(projectId, searchTerm, searchTerm, searchTerm, pageable)
                    .map(this::convertToDTO);
        } else {
            return taskRepository.findByProjectId(projectId, pageable)
                    .map(this::convertToDTO);
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
            return taskRepository.findByUserEmailAndProjectIdAndTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrTicketIdContainingIgnoreCase(userEmail, projectId, searchTerm, searchTerm, searchTerm, pageable)
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
            task.setBillingDate(update.getBillingDate());
            task.setInvoiceId(update.getInvoiceId());
            Task savedTask = taskRepository.save(task);
            updatedTasks.add(convertToDTO(savedTask));

            try {
                googleSheetsService.updateTaskRowByTicketId(savedTask.getTicketId(), mapTaskToSheetRow(savedTask));
            } catch (Exception e) {
                logger.error("Failed to update task in Google Sheets: {}", e.getMessage());
            }
    
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
            task.setPaymentDate(update.getPaymentDate());
            Task savedTask = taskRepository.save(task);
            updatedTasks.add(convertToDTO(savedTask));
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

    public void putTasksOnGoogleSheets(String userEmail) {
        List<Task> tasks = taskRepository.findByUserEmail(userEmail);
        tasks = tasks.stream().sorted(Comparator.comparing(Task::getStartDate).reversed()).collect(Collectors.toList());

        // Sync to Google Sheets
        try {
            List<List<Object>> list = tasks.stream()
            .map(this::mapTaskToSheetRow)
            .collect(Collectors.toList());

            googleSheetsService.addBulk(list);
        } catch (Exception e) {
            logger.error("Failed to add task to Google Sheets: {}", e.getMessage());
        }

    }
} 
package com.myworkmanagement.company.service;

import com.myworkmanagement.company.dto.TaskBillingStatusUpdateDTO;
import com.myworkmanagement.company.dto.TaskPaymentStatusUpdateDTO;
import com.myworkmanagement.company.dto.TaskDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface TaskService {
    /**
     * Creates a new task and adds a corresponding row in the Google Sheet.
     */
    TaskDTO createTask(Long projectId, TaskDTO taskDTO);

    /**
     * Updates an existing task and updates the corresponding row in the Google Sheet.
     */
    TaskDTO updateTask(Long id, TaskDTO taskDTO);

    TaskDTO getTask(Long id);
    Page<TaskDTO> getTasksByUserEmail(String userEmail, Pageable pageable, String search);
    // Not used in TaskController - controller uses the 7-parameter version with 'type' parameter
    // Page<TaskDTO> getTasksByUserEmail(String userEmail, Pageable pageable, String search, Long projectId, Boolean isBilled, Boolean isPaid);
    Page<TaskDTO> getTasksByUserEmail(String userEmail, Pageable pageable, String search, Long projectId, Boolean isBilled, Boolean isPaid, String type);
    // Not used in TaskController - controller uses the 7-parameter version with all filters
    // Page<TaskDTO> getTasksByProject(Long projectId, Pageable pageable, String search);
    // Not used in TaskController - controller uses the 7-parameter version with 'type' parameter
    // Page<TaskDTO> getTasksByProject(Long projectId, Pageable pageable, String search, Boolean isBilled, Boolean isPaid, String userEmail);
    Page<TaskDTO> getTasksByProject(Long projectId, Pageable pageable, String search, Boolean isBilled, Boolean isPaid, String userEmail, String type);
    Page<TaskDTO> getTasksByProjectAndDateRange(Long projectId, LocalDate startDate, LocalDate endDate, Pageable pageable);
    Page<TaskDTO> getUnbilledTasks(Pageable pageable);
    Page<TaskDTO> getUnpaidTasks(Pageable pageable);
    Page<TaskDTO> getUnbilledTasksByProject(Long projectId, Pageable pageable);
    Page<TaskDTO> getUnpaidTasksByProject(Long projectId, Pageable pageable);
    Page<TaskDTO> getTasksByUserEmailAndProject(String userEmail, Long projectId, Pageable pageable, String search);
    Page<TaskDTO> getUnbilledTasksByUserEmail(String userEmail, Pageable pageable);
    Page<TaskDTO> getUnpaidTasksByUserEmail(String userEmail, Pageable pageable);
    Page<TaskDTO> getUnbilledTasksByUserEmailAndProject(String userEmail, Long projectId, Pageable pageable);
    Page<TaskDTO> getUnpaidTasksByUserEmailAndProject(String userEmail, Long projectId, Pageable pageable);
    void deleteTask(Long id);

    /**
     * Updates the billing status for multiple tasks
     * @param taskUpdates List of task updates containing task IDs and their new billing status
     * @return List of updated task DTOs
     * @throws TaskBillingStatusException if any task is not found or update fails
     */
    List<TaskDTO> updateTasksBillingStatus(List<TaskBillingStatusUpdateDTO> taskUpdates);

    /**
     * Updates the payment status for multiple tasks
     * @param taskUpdates List of task updates containing task IDs and their new payment status
     * @return List of updated task DTOs
     * @throws TaskPaymentStatusException if any task is not found or update fails
     */
    List<TaskDTO> updateTasksPaymentStatus(List<TaskPaymentStatusUpdateDTO> taskUpdates);
} 
package com.myworkmanagement.company.service;

import com.myworkmanagement.company.dto.TaskDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface TaskService {
    TaskDTO createTask(Long projectId, TaskDTO taskDTO);
    TaskDTO updateTask(Long id, TaskDTO taskDTO);
    TaskDTO getTask(Long id);
    List<TaskDTO> getAllTasks();
    List<TaskDTO> getTasksByProject(Long projectId);
    List<TaskDTO> getTasksByProjectAndDateRange(Long projectId, LocalDate startDate, LocalDate endDate);
    List<TaskDTO> getUnbilledTasks();
    List<TaskDTO> getUnpaidTasks();
    List<TaskDTO> getUnbilledTasksByProject(Long projectId);
    List<TaskDTO> getUnpaidTasksByProject(Long projectId);
    void deleteTask(Long id);

    // New methods for user email filtering
    List<TaskDTO> getTasksByUserEmail(String userEmail);
    List<TaskDTO> getTasksByUserEmailAndProject(String userEmail, Long projectId);
    List<TaskDTO> getUnbilledTasksByUserEmail(String userEmail);
    List<TaskDTO> getUnpaidTasksByUserEmail(String userEmail);
    List<TaskDTO> getUnbilledTasksByUserEmailAndProject(String userEmail, Long projectId);
    List<TaskDTO> getUnpaidTasksByUserEmailAndProject(String userEmail, Long projectId);

    // Paginated methods with search
    Page<TaskDTO> getTasksByUserEmail(String userEmail, Pageable pageable, String search);
    Page<TaskDTO> getTasksByProject(Long projectId, Pageable pageable, String search);
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
} 
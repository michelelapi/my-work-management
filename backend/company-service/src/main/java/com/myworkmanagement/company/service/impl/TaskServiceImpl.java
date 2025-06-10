package com.myworkmanagement.company.service.impl;

import com.myworkmanagement.company.dto.TaskDTO;
import com.myworkmanagement.company.entity.Project;
import com.myworkmanagement.company.entity.Task;
import com.myworkmanagement.company.exception.ResourceNotFoundException;
import com.myworkmanagement.company.repository.ProjectRepository;
import com.myworkmanagement.company.repository.TaskRepository;
import com.myworkmanagement.company.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    @Override
    @Transactional
    public TaskDTO createTask(TaskDTO taskDTO) {
        Project project = projectRepository.findById(taskDTO.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + taskDTO.getProjectId()));

        Task task = Task.builder()
                .project(project)
                .title(taskDTO.getTitle())
                .description(taskDTO.getDescription())
                .ticketId(taskDTO.getTicketId())
                .startDate(taskDTO.getStartDate())
                .endDate(taskDTO.getEndDate())
                .hoursWorked(taskDTO.getHoursWorked())
                .rateUsed(taskDTO.getRateUsed())
                .rateType(taskDTO.getRateType())
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
        task.setRateType(taskDTO.getRateType());
        task.setCurrency(taskDTO.getCurrency());
        task.setIsBilled(taskDTO.getIsBilled());
        task.setIsPaid(taskDTO.getIsPaid());
        task.setBillingDate(taskDTO.getBillingDate());
        task.setPaymentDate(taskDTO.getPaymentDate());
        task.setInvoiceId(taskDTO.getInvoiceId());
        task.setNotes(taskDTO.getNotes());
        task.setUserEmail(taskDTO.getUserEmail());

        Task updatedTask = taskRepository.save(task);
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
        if (!taskRepository.existsById(id)) {
            throw new ResourceNotFoundException("Task not found with id: " + id);
        }
        taskRepository.deleteById(id);
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
    public Page<TaskDTO> getTasksByUserEmail(String userEmail, Pageable pageable) {
        return taskRepository.findByUserEmail(userEmail, pageable)
                .map(this::convertToDTO);
    }

    @Override
    public Page<TaskDTO> getTasksByProject(Long projectId, Pageable pageable) {
        return taskRepository.findByProjectId(projectId, pageable)
                .map(this::convertToDTO);
    }

    @Override
    public Page<TaskDTO> getTasksByProjectAndDateRange(Long projectId, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        return taskRepository.findByProjectIdAndStartDateBetween(projectId, startDate, endDate, pageable)
                .map(this::convertToDTO);
    }

    @Override
    public Page<TaskDTO> getUnbilledTasks(Pageable pageable) {
        return taskRepository.findByIsBilledFalse(pageable)
                .map(this::convertToDTO);
    }

    @Override
    public Page<TaskDTO> getUnpaidTasks(Pageable pageable) {
        return taskRepository.findByIsPaidFalse(pageable)
                .map(this::convertToDTO);
    }

    @Override
    public Page<TaskDTO> getUnbilledTasksByProject(Long projectId, Pageable pageable) {
        return taskRepository.findByProjectIdAndIsBilledFalse(projectId, pageable)
                .map(this::convertToDTO);
    }

    @Override
    public Page<TaskDTO> getUnpaidTasksByProject(Long projectId, Pageable pageable) {
        return taskRepository.findByProjectIdAndIsPaidFalse(projectId, pageable)
                .map(this::convertToDTO);
    }

    @Override
    public Page<TaskDTO> getTasksByUserEmailAndProject(String userEmail, Long projectId, Pageable pageable) {
        return taskRepository.findByUserEmailAndProjectId(userEmail, projectId, pageable)
                .map(this::convertToDTO);
    }

    @Override
    public Page<TaskDTO> getUnbilledTasksByUserEmail(String userEmail, Pageable pageable) {
        return taskRepository.findByUserEmailAndIsBilledFalse(userEmail, pageable)
                .map(this::convertToDTO);
    }

    @Override
    public Page<TaskDTO> getUnpaidTasksByUserEmail(String userEmail, Pageable pageable) {
        return taskRepository.findByUserEmailAndIsPaidFalse(userEmail, pageable)
                .map(this::convertToDTO);
    }

    @Override
    public Page<TaskDTO> getUnbilledTasksByUserEmailAndProject(String userEmail, Long projectId, Pageable pageable) {
        return taskRepository.findByUserEmailAndProjectIdAndIsBilledFalse(userEmail, projectId, pageable)
                .map(this::convertToDTO);
    }

    @Override
    public Page<TaskDTO> getUnpaidTasksByUserEmailAndProject(String userEmail, Long projectId, Pageable pageable) {
        return taskRepository.findByUserEmailAndProjectIdAndIsPaidFalse(userEmail, projectId, pageable)
                .map(this::convertToDTO);
    }

    private TaskDTO convertToDTO(Task task) {
        return TaskDTO.builder()
                .id(task.getId())
                .projectId(task.getProject().getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .ticketId(task.getTicketId())
                .startDate(task.getStartDate())
                .endDate(task.getEndDate())
                .hoursWorked(task.getHoursWorked())
                .rateUsed(task.getRateUsed())
                .rateType(task.getRateType())
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
                .projectName(task.getProject().getName())
                .companyName(task.getProject().getCompany().getName())
                .build();
    }
} 
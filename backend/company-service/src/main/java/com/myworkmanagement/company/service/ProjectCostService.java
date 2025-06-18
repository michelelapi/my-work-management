package com.myworkmanagement.company.service;

import com.myworkmanagement.company.dto.ProjectCostDTO;
import com.myworkmanagement.company.entity.Project;
import com.myworkmanagement.company.entity.Task;
import com.myworkmanagement.company.repository.ProjectRepository;
import com.myworkmanagement.company.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectCostService {
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    public List<ProjectCostDTO> getProjectCostsByMonth(String userEmail) {
        List<Project> projects = projectRepository.findAllByUserEmail(userEmail);
        List<ProjectCostDTO> costs = new ArrayList<>();

        for (Project project : projects) {
            List<Task> tasks = taskRepository.findByProjectId(project.getId());
            
            // Group tasks by month and calculate total cost
            Map<String, Double> monthlyCosts = tasks.stream()
                .collect(Collectors.groupingBy(
                    task -> task.getStartDate().format(MONTH_FORMATTER),
                    Collectors.summingDouble(task -> 
                        task.getRateUsed().multiply(task.getHoursWorked()).doubleValue()
                    )
                ));

            // Convert to DTOs
            monthlyCosts.forEach((month, totalCost) -> 
                costs.add(new ProjectCostDTO(project.getName(), month, totalCost))
            );
        }

        return costs;
    }
} 
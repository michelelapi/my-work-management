package com.myworkmanagement.company.service.impl;

import com.myworkmanagement.company.dto.CompanyProjectStatsDTO;
import com.myworkmanagement.company.repository.CompanyRepository;
import com.myworkmanagement.company.repository.ProjectRepository;
import com.myworkmanagement.company.repository.TaskRepository;
import com.myworkmanagement.company.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticsServiceImpl implements StatisticsService {

    private final CompanyRepository companyRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    @Override
    public List<CompanyProjectStatsDTO> getCompanyProjectStats(String userEmail) {
        return companyRepository.findAllByUserEmail(userEmail, null).getContent().stream()
                .map(company -> {
                    Long taskCount = taskRepository.countByCompanyId(company.getId());
                    Integer totalHours = taskRepository.sumHoursByCompanyId(company.getId());
                    BigDecimal totalAmount = taskRepository.sumAmountByCompanyId(company.getId());
                    BigDecimal totalToBeBilledAmount = taskRepository.sumAmountByCompanyIdAndIsBilled(company.getId(), false);
                    BigDecimal totalToBePaidAmount = taskRepository.sumAmountByCompanyIdAndIsPaid(company.getId(), false);
                    // Get the first project's currency for the company, or default to 'EUR'
                    String currency = projectRepository.findByCompanyId(company.getId(), org.springframework.data.domain.PageRequest.of(0, 1))
                        .stream()
                        .findFirst()
                        .map(project -> project.getCurrency() != null ? project.getCurrency() : "EUR")
                        .orElse("EUR");
                    
                    return CompanyProjectStatsDTO.builder()
                            .companyId(company.getId())
                            .companyName(company.getName())
                            .projectCount(projectRepository.countByCompanyId(company.getId()))
                            .taskCount(taskCount)
                            .totalHours(totalHours != null ? totalHours : 0)
                            .totalAmount(totalAmount != null ? totalAmount : BigDecimal.ZERO)
                            .totalToBeBilledAmount(totalToBeBilledAmount != null ? totalToBeBilledAmount : BigDecimal.ZERO)
                            .totalToBePaidAmount(totalToBePaidAmount != null ? totalToBePaidAmount : BigDecimal.ZERO)
                            .currency(currency)
                            .build();
                })
                .collect(Collectors.toList());
    }
} 
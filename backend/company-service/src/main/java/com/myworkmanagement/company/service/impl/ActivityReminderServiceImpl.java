package com.myworkmanagement.company.service.impl;

import com.myworkmanagement.company.dto.ActivityReminderCreateDTO;
import com.myworkmanagement.company.dto.ActivityReminderDTO;
import com.myworkmanagement.company.dto.ReminderPreflightResponseDTO;
import com.myworkmanagement.company.entity.ActivityEndpointMap;
import com.myworkmanagement.company.entity.ActivityReminder;
import com.myworkmanagement.company.exception.ResourceNotFoundException;
import com.myworkmanagement.company.repository.ActivityEndpointMapRepository;
import com.myworkmanagement.company.repository.ActivityReminderRepository;
import com.myworkmanagement.company.service.ActivityReminderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ActivityReminderServiceImpl implements ActivityReminderService {

    private final ActivityReminderRepository activityReminderRepository;
    private final ActivityEndpointMapRepository activityEndpointMapRepository;

    @Override
    @Transactional(readOnly = true)
    public List<String> getAvailableActivities() {
        return activityEndpointMapRepository.findDistinctEnabledActivityNames();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ActivityReminderDTO> getActiveReminders(String userEmail, Pageable pageable) {
        Pageable effectivePageable = pageable.getSort().isSorted()
                ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "creationDate"));
        return activityReminderRepository.findByUserEmailAndActiveTrue(userEmail, effectivePageable).map(this::mapToDTO);
    }

    @Override
    @Transactional
    public ActivityReminderDTO createReminder(String userEmail, ActivityReminderCreateDTO request) {
        String activityName = request.getActivityName().trim();
        String message = request.getMessage().trim();

        boolean activityExists = activityEndpointMapRepository.findDistinctEnabledActivityNames().stream()
                .anyMatch(name -> name.equals(activityName));
        if (!activityExists) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected activity is not available");
        }

        ActivityReminder saved = activityReminderRepository.save(ActivityReminder.builder()
                .userEmail(userEmail)
                .activityName(activityName)
                .message(message)
                .active(Boolean.TRUE)
                .completedDate(null)
                .build());
        return mapToDTO(saved);
    }

    @Override
    @Transactional
    public ActivityReminderDTO completeReminder(String userEmail, Long reminderId) {
        ActivityReminder reminder = activityReminderRepository.findByIdAndUserEmail(reminderId, userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Reminder not found with id: " + reminderId));

        if (Boolean.TRUE.equals(reminder.getActive())) {
            reminder.setActive(Boolean.FALSE);
            reminder.setCompletedDate(LocalDateTime.now());
            reminder = activityReminderRepository.save(reminder);
        }

        return mapToDTO(reminder);
    }

    @Override
    @Transactional(readOnly = true)
    public ReminderPreflightResponseDTO checkPreflight(String userEmail, String httpMethod, String path) {
        String normalizedMethod = httpMethod == null ? "" : httpMethod.trim().toUpperCase();
        String normalizedPath = normalizePath(path);
        if (normalizedMethod.isEmpty() || normalizedPath.isEmpty()) {
            return ReminderPreflightResponseDTO.builder()
                    .shouldShowReminder(Boolean.FALSE)
                    .reminder(null)
                    .build();
        }

        List<ActivityEndpointMap> candidates = activityEndpointMapRepository
                .findByHttpMethodIgnoreCaseAndEnabledTrue(normalizedMethod);

        Set<String> matchedActivities = new LinkedHashSet<>();
        for (ActivityEndpointMap mapping : candidates) {
            if (pathMatches(mapping.getEndpointPattern(), normalizedPath)) {
                matchedActivities.add(mapping.getActivityName());
            }
        }

        for (String activityName : matchedActivities) {
            ActivityReminder reminder = activityReminderRepository
                    .findFirstByUserEmailAndActiveTrueAndActivityNameOrderByCreationDateAsc(userEmail, activityName)
                    .orElse(null);
            if (reminder != null) {
                return ReminderPreflightResponseDTO.builder()
                        .shouldShowReminder(Boolean.TRUE)
                        .reminder(mapToDTO(reminder))
                        .build();
            }
        }

        return ReminderPreflightResponseDTO.builder()
                .shouldShowReminder(Boolean.FALSE)
                .reminder(null)
                .build();
    }

    private String normalizePath(String path) {
        if (path == null) {
            return "";
        }
        String normalized = path.trim();
        int queryIndex = normalized.indexOf('?');
        if (queryIndex >= 0) {
            normalized = normalized.substring(0, queryIndex);
        }
        if (!normalized.startsWith("/")) {
            normalized = "/" + normalized;
        }
        return normalized;
    }

    private boolean pathMatches(String pattern, String actualPath) {
        StringBuilder regex = new StringBuilder("^");
        int segmentStart = 0;
        int openBrace;
        while ((openBrace = pattern.indexOf('{', segmentStart)) >= 0) {
            int closeBrace = pattern.indexOf('}', openBrace);
            if (closeBrace < 0) {
                break;
            }
            regex.append(Pattern.quote(pattern.substring(segmentStart, openBrace)));
            regex.append("[^/]+");
            segmentStart = closeBrace + 1;
        }
        regex.append(Pattern.quote(pattern.substring(segmentStart)));
        regex.append("$");
        return actualPath.matches(regex.toString());
    }

    private ActivityReminderDTO mapToDTO(ActivityReminder reminder) {
        return ActivityReminderDTO.builder()
                .id(reminder.getId())
                .activityName(reminder.getActivityName())
                .message(reminder.getMessage())
                .active(reminder.getActive())
                .creationDate(reminder.getCreationDate())
                .completedDate(reminder.getCompletedDate())
                .build();
    }
}

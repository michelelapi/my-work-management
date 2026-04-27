package com.myworkmanagement.company.service;

import com.myworkmanagement.company.dto.ActivityReminderCreateDTO;
import com.myworkmanagement.company.dto.ActivityReminderDTO;
import com.myworkmanagement.company.dto.ReminderPreflightResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ActivityReminderService {
    List<String> getAvailableActivities();

    Page<ActivityReminderDTO> getActiveReminders(String userEmail, Pageable pageable);

    ActivityReminderDTO createReminder(String userEmail, ActivityReminderCreateDTO request);

    ActivityReminderDTO completeReminder(String userEmail, Long reminderId);

    ReminderPreflightResponseDTO checkPreflight(String userEmail, String httpMethod, String path);
}

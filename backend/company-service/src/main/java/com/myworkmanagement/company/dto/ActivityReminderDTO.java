package com.myworkmanagement.company.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Reminder linked to an activity")
public class ActivityReminderDTO {
    @Schema(description = "Unique identifier", example = "1")
    private Long id;

    @Schema(description = "Activity name", example = "Generate SAL")
    private String activityName;

    @Schema(description = "Reminder message", example = "Remember to call xxx")
    private String message;

    @Schema(description = "Whether reminder is still active", example = "true")
    private Boolean active;

    @Schema(description = "Creation timestamp", example = "2026-04-27T16:10:00")
    private LocalDateTime creationDate;

    @Schema(description = "Completion timestamp", example = "2026-04-27T16:15:00")
    private LocalDateTime completedDate;
}

package com.myworkmanagement.company.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Payload to create an activity reminder")
public class ActivityReminderCreateDTO {
    @NotBlank(message = "Activity name is required")
    @Schema(description = "Activity name selected by user", example = "Generate SAL")
    private String activityName;

    @NotBlank(message = "Reminder message is required")
    @Size(max = 1000, message = "Reminder message must be at most 1000 characters")
    @Schema(description = "Reminder message shown in popup", example = "Remember to call xxx")
    private String message;
}

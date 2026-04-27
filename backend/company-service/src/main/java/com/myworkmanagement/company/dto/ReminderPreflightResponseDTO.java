package com.myworkmanagement.company.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response for reminder preflight checks")
public class ReminderPreflightResponseDTO {
    @Schema(description = "Whether UI should show reminder popup", example = "true")
    private Boolean shouldShowReminder;

    @Schema(description = "Reminder to show when shouldShowReminder is true")
    private ActivityReminderDTO reminder;
}

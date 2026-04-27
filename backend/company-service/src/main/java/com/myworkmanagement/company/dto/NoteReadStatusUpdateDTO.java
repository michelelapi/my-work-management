package com.myworkmanagement.company.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "DTO for updating note read status")
public class NoteReadStatusUpdateDTO {
    @NotNull(message = "readTick is required")
    @Schema(description = "New read status for the note", example = "true")
    private Boolean readTick;
}

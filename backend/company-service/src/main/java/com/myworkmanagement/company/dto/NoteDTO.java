package com.myworkmanagement.company.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Note data transfer object")
public class NoteDTO {
    @Schema(description = "Unique identifier of the note", example = "1")
    private Long id;

    @NotBlank(message = "Note content is required")
    @Schema(description = "Content of the note", example = "Remember to send monthly report by Friday.")
    private String content;

    @Schema(description = "Timestamp when the note was created", example = "2026-04-27T15:30:00")
    private LocalDateTime creationDate;

    @Schema(description = "Whether the note has been read", example = "false")
    private Boolean readTick;

    @Schema(description = "Timestamp when the note was read", example = "2026-04-27T16:10:00")
    private LocalDateTime readDate;
}

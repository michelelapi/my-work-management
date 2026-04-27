package com.myworkmanagement.company.controller;

import com.myworkmanagement.company.dto.NoteDTO;
import com.myworkmanagement.company.dto.NoteReadStatusUpdateDTO;
import com.myworkmanagement.company.service.NoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Notes", description = "Notes management APIs")
@SecurityRequirement(name = "bearerAuth")
public class NoteController {

    private final NoteService noteService;

    @GetMapping("/notes")
    @Operation(summary = "Get notes for authenticated user", description = "Retrieves a paginated list of notes for the currently logged-in user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved notes"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<NoteDTO>> getNotes(
            @Parameter(description = "Pagination parameters (page, size, sort)", required = false) Pageable pageable) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return ResponseEntity.ok(noteService.getNotesByUserEmail(userEmail, pageable));
    }

    @PostMapping("/notes")
    @Operation(summary = "Create a new note", description = "Creates a new unread note for the current user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Note created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<NoteDTO> createNote(
            @Parameter(description = "Note data", required = true, schema = @Schema(implementation = NoteDTO.class))
            @Valid @RequestBody NoteDTO noteDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return new ResponseEntity<>(noteService.createNote(userEmail, noteDTO), HttpStatus.CREATED);
    }

    @PatchMapping("/notes/{id}/read-status")
    @Operation(summary = "Update note read status", description = "Sets note read/unread state. If unread, read date is cleared")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Note status updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Note not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<NoteDTO> updateReadStatus(
            @Parameter(description = "Unique identifier of the note", required = true, example = "1") @PathVariable Long id,
            @Valid @RequestBody NoteReadStatusUpdateDTO request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return ResponseEntity.ok(noteService.updateReadStatus(userEmail, id, request.getReadTick()));
    }

    @DeleteMapping("/notes/{id}")
    @Operation(summary = "Delete note", description = "Deletes a note owned by the current user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Note deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Note not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Void> deleteNote(
            @Parameter(description = "Unique identifier of the note", required = true, example = "1") @PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        noteService.deleteNote(userEmail, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/notes/unread-count")
    @Operation(summary = "Get unread note count", description = "Returns the number of unread notes for the current user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved unread count"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return ResponseEntity.ok(Map.of("count", noteService.getUnreadCount(userEmail)));
    }
}

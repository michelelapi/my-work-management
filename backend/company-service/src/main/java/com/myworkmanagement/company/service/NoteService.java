package com.myworkmanagement.company.service;

import com.myworkmanagement.company.dto.NoteDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NoteService {
    Page<NoteDTO> getNotesByUserEmail(String userEmail, Pageable pageable);
    NoteDTO createNote(String userEmail, NoteDTO noteDTO);
    NoteDTO updateReadStatus(String userEmail, Long noteId, boolean readTick);
    void deleteNote(String userEmail, Long noteId);
    long getUnreadCount(String userEmail);
}

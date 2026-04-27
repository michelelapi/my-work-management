package com.myworkmanagement.company.service.impl;

import com.myworkmanagement.company.dto.NoteDTO;
import com.myworkmanagement.company.entity.Note;
import com.myworkmanagement.company.exception.ResourceNotFoundException;
import com.myworkmanagement.company.repository.NoteRepository;
import com.myworkmanagement.company.service.NoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NoteServiceImpl implements NoteService {

    private final NoteRepository noteRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<NoteDTO> getNotesByUserEmail(String userEmail, Pageable pageable) {
        Pageable effectivePageable = pageable.getSort().isSorted()
                ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "creationDate"));
        return noteRepository.findByUserEmail(userEmail, effectivePageable).map(this::mapToDTO);
    }

    @Override
    @Transactional
    public NoteDTO createNote(String userEmail, NoteDTO noteDTO) {
        Note note = Note.builder()
                .userEmail(userEmail)
                .content(noteDTO.getContent())
                .readTick(Boolean.FALSE)
                .readDate(null)
                .build();
        return mapToDTO(noteRepository.save(note));
    }

    @Override
    @Transactional
    public NoteDTO updateReadStatus(String userEmail, Long noteId, boolean readTick) {
        Note note = noteRepository.findByIdAndUserEmail(noteId, userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));

        note.setReadTick(readTick);
        note.setReadDate(readTick ? LocalDateTime.now() : null);
        return mapToDTO(noteRepository.save(note));
    }

    @Override
    @Transactional
    public void deleteNote(String userEmail, Long noteId) {
        Note note = noteRepository.findByIdAndUserEmail(noteId, userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));
        noteRepository.delete(note);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(String userEmail) {
        return noteRepository.countByUserEmailAndReadTickFalse(userEmail);
    }

    private NoteDTO mapToDTO(Note note) {
        return NoteDTO.builder()
                .id(note.getId())
                .content(note.getContent())
                .creationDate(note.getCreationDate())
                .readTick(note.getReadTick())
                .readDate(note.getReadDate())
                .build();
    }
}

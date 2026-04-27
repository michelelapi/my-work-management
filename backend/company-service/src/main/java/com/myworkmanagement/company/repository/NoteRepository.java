package com.myworkmanagement.company.repository;

import com.myworkmanagement.company.entity.Note;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    Page<Note> findByUserEmail(String userEmail, Pageable pageable);
    Optional<Note> findByIdAndUserEmail(Long id, String userEmail);
    long countByUserEmailAndReadTickFalse(String userEmail);
}

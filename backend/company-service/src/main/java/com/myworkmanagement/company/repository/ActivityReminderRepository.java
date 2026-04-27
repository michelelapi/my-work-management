package com.myworkmanagement.company.repository;

import com.myworkmanagement.company.entity.ActivityReminder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ActivityReminderRepository extends JpaRepository<ActivityReminder, Long> {
    Page<ActivityReminder> findByUserEmailAndActiveTrue(String userEmail, Pageable pageable);

    Optional<ActivityReminder> findByIdAndUserEmail(Long id, String userEmail);

    Optional<ActivityReminder> findFirstByUserEmailAndActiveTrueAndActivityNameOrderByCreationDateAsc(
            String userEmail,
            String activityName
    );
}

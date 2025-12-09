package com.myworkmanagement.company.repository;

import com.myworkmanagement.company.entity.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectId(Long projectId);
    
    Page<Task> findByUserEmail(String userEmail, Pageable pageable);
    Page<Task> findByProjectId(Long projectId, Pageable pageable);
    Page<Task> findByProjectIdAndStartDateBetween(Long projectId, LocalDate startDate, LocalDate endDate, Pageable pageable);
    Page<Task> findByIsBilledFalse(Pageable pageable);
    Page<Task> findByIsPaidFalse(Pageable pageable);
    Page<Task> findByProjectIdAndIsBilledFalse(Long projectId, Pageable pageable);
    Page<Task> findByProjectIdAndIsPaidFalse(Long projectId, Pageable pageable);
    Page<Task> findByUserEmailAndProjectId(String userEmail, Long projectId, Pageable pageable);
    Page<Task> findByUserEmailAndIsBilledFalse(String userEmail, Pageable pageable);
    Page<Task> findByUserEmailAndIsPaidFalse(String userEmail, Pageable pageable);
    Page<Task> findByUserEmailAndProjectIdAndIsBilledFalse(String userEmail, Long projectId, Pageable pageable);
    Page<Task> findByUserEmailAndProjectIdAndIsPaidFalse(String userEmail, Long projectId, Pageable pageable);

    // New methods for search functionality
    @Query("SELECT t " +
    "FROM Task t " +
    "WHERE t.userEmail = :userEmail AND " +
    "(LOWER(t.title) LIKE LOWER(CONCAT('%', :title, '%')) OR " +
    "LOWER(t.description) LIKE LOWER(CONCAT('%', :description, '%')) OR " +
    "LOWER(t.ticketId) LIKE LOWER(CONCAT('%', :ticketId, '%')) OR " +
    "FORMAT(t.startDate, 'dd/MM/yyyy') LIKE CONCAT('%', :startDate, '%'))")
    Page<Task> findByUserEmailAndSearch(@Param("userEmail") String userEmail, @Param("title") String title, @Param("description") String description, @Param("ticketId") String ticketId, @Param("startDate") String startDate, Pageable pageable);
    Page<Task> findByProjectIdAndTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrTicketIdContainingIgnoreCase(Long projectId, String title, String description, String ticketId, Pageable pageable);

    @Query("SELECT t " +
        "FROM Task t " +
        "WHERE t.userEmail = :userEmail " +
        "AND (:projectId IS NULL OR t.project.id = :projectId) " +
        "AND (:type IS NULL OR t.type = :type) " +
        "AND (:isBilled IS NULL OR t.isBilled = :isBilled) " +
        "AND (:isPaid IS NULL OR t.isPaid = :isPaid) " +
        "AND (" +
        "   LOWER(t.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
        "   LOWER(t.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
        "   LOWER(t.ticketId) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
        "   FORMAT(t.startDate, 'dd/MM/yyyy') LIKE CONCAT('%', :searchTerm, '%')" +
        ")")
    Page<Task> findByUserEmailAndFilters(
        @Param("userEmail") String userEmail,
        @Param("projectId") Long projectId,
        @Param("type") String type,
        @Param("isBilled") Boolean isBilled,
        @Param("isPaid") Boolean isPaid,
        @Param("searchTerm") String searchTerm,
        Pageable pageable
    );

    @Query("SELECT COUNT(t) FROM Task t JOIN t.project p WHERE p.company.id = :companyId")
    Long countByCompanyId(@Param("companyId") Long companyId);
    
    @Query("SELECT COALESCE(SUM(t.hoursWorked), 0) FROM Task t JOIN t.project p WHERE p.company.id = :companyId")
    Integer sumHoursByCompanyId(@Param("companyId") Long companyId);
    
    @Query("SELECT COALESCE(SUM(t.rateUsed * t.hoursWorked), 0) FROM Task t JOIN t.project p WHERE p.company.id = :companyId")
    BigDecimal sumAmountByCompanyId(@Param("companyId") Long companyId);

    @Query("SELECT COALESCE(SUM(t.rateUsed * t.hoursWorked), 0) FROM Task t JOIN t.project p WHERE p.company.id = :companyId AND t.isBilled = :isBilled")
    BigDecimal sumAmountByCompanyIdAndIsBilled(@Param("companyId") Long companyId, @Param("isBilled") boolean isBilled);

    @Query("SELECT COALESCE(SUM(t.rateUsed * t.hoursWorked), 0) FROM Task t JOIN t.project p WHERE p.company.id = :companyId AND t.isPaid = :isPaid")
    BigDecimal sumAmountByCompanyIdAndIsPaid(@Param("companyId") Long companyId, @Param("isPaid") boolean isPaid);

    @Query("SELECT t FROM Task t JOIN t.project p WHERE t.userEmail = :userEmail AND p.company.id = :companyId AND t.startDate BETWEEN :startDate AND :endDate")
    List<Task> findByUserEmailAndCompanyIdAndDateRange(
        @Param("userEmail") String userEmail,
        @Param("companyId") Long companyId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

} 
package com.myworkmanagement.company.controller;

import com.myworkmanagement.company.dto.BackupType;
import com.myworkmanagement.company.dto.DbBackupDTO;
import com.myworkmanagement.company.service.DbBackupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/db-backups")
@RequiredArgsConstructor
@Tag(name = "Database Backups", description = "Database backup management APIs")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'USER')")
public class DbBackupController {

    private final DbBackupService dbBackupService;

    @PostMapping
    @Operation(
            summary = "Create database backup",
            description = "Creates a FULL (entire DB) or INCREMENTAL (changed tables only) SQL dump"
    )
    public ResponseEntity<DbBackupDTO> createBackup(
            @RequestParam(defaultValue = "INCREMENTAL") BackupType type
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(dbBackupService.createBackup(type));
    }

    @GetMapping
    @Operation(summary = "List database backups", description = "Lists existing company database backup files")
    public ResponseEntity<List<DbBackupDTO>> listBackups() {
        return ResponseEntity.ok(dbBackupService.listBackups());
    }
}

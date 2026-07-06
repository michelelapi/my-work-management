package com.myworkmanagement.authservice.controller;

import com.myworkmanagement.authservice.dto.DbBackupDTO;
import com.myworkmanagement.authservice.service.DbBackupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/db-backups")
@RequiredArgsConstructor
@Tag(name = "Database Backups", description = "Database backup management APIs")
public class DbBackupController {

    private final DbBackupService dbBackupService;

    @PostMapping
    @Operation(summary = "Create database backup", description = "Creates a SQL dump of the authentication database")
    public ResponseEntity<DbBackupDTO> createBackup() {
        return ResponseEntity.status(HttpStatus.CREATED).body(dbBackupService.createBackup());
    }

    @GetMapping
    @Operation(summary = "List database backups", description = "Lists existing authentication database backup files")
    public ResponseEntity<List<DbBackupDTO>> listBackups() {
        return ResponseEntity.ok(dbBackupService.listBackups());
    }
}

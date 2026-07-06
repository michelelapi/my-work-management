package com.myworkmanagement.company.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DbBackupDTO {
    private String fileName;
    private String databaseName;
    private long sizeBytes;
    private String createdAt;
}

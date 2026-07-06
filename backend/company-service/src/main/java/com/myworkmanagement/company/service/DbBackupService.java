package com.myworkmanagement.company.service;

import com.myworkmanagement.company.dto.DbBackupDTO;
import com.myworkmanagement.company.exception.DbBackupException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

@Service
@Slf4j
public class DbBackupService {

    private static final Pattern JDBC_URL_PATTERN =
            Pattern.compile("jdbc:postgresql://([^:/]+)(?::(\\d+))?/([^?]+)");
    private static final DateTimeFormatter FILE_TIMESTAMP_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd_HHmmss").withZone(ZoneId.systemDefault());
    private static final DateTimeFormatter ISO_FORMAT =
            DateTimeFormatter.ISO_INSTANT;

    @Value("${spring.datasource.url}")
    private String jdbcUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Value("${db-backup.directory:db-backup}")
    private String backupDirectory;

    @Value("${db-backup.use-docker:false}")
    private boolean useDocker;

    @Value("${db-backup.docker-container:}")
    private String dockerContainer;

    @Value("${db-backup.pg-dump-command:pg_dump}")
    private String pgDumpCommand;

    public DbBackupDTO createBackup() {
        JdbcConnectionInfo connectionInfo = parseJdbcUrl(jdbcUrl);
        Path backupDir = resolveBackupDirectory();
        String timestamp = FILE_TIMESTAMP_FORMAT.format(Instant.now());
        String fileName = connectionInfo.databaseName() + "_" + timestamp + ".sql";
        Path outputFile = backupDir.resolve(fileName);

        runPgDump(connectionInfo, outputFile);

        try {
            BasicFileAttributes attributes = Files.readAttributes(outputFile, BasicFileAttributes.class);
            return DbBackupDTO.builder()
                    .fileName(fileName)
                    .databaseName(connectionInfo.databaseName())
                    .sizeBytes(attributes.size())
                    .createdAt(ISO_FORMAT.format(attributes.creationTime().toInstant()))
                    .build();
        } catch (IOException e) {
            throw new DbBackupException("Backup created but failed to read file metadata: " + fileName, e);
        }
    }

    public List<DbBackupDTO> listBackups() {
        Path backupDir = resolveBackupDirectory();
        List<DbBackupDTO> backups = new ArrayList<>();

        try (Stream<Path> files = Files.list(backupDir)) {
            files.filter(path -> Files.isRegularFile(path) && path.getFileName().toString().endsWith(".sql"))
                    .forEach(path -> backups.add(toDto(path)));
        } catch (IOException e) {
            throw new DbBackupException("Failed to list database backups", e);
        }

        backups.sort(Comparator.comparing(DbBackupDTO::getCreatedAt).reversed());
        return backups;
    }

    private DbBackupDTO toDto(Path path) {
        try {
            BasicFileAttributes attributes = Files.readAttributes(path, BasicFileAttributes.class);
            String fileName = path.getFileName().toString();
            String databaseName = fileName.contains("_")
                    ? fileName.substring(0, fileName.indexOf('_'))
                    : fileName.replace(".sql", "");

            return DbBackupDTO.builder()
                    .fileName(fileName)
                    .databaseName(databaseName)
                    .sizeBytes(attributes.size())
                    .createdAt(ISO_FORMAT.format(attributes.creationTime().toInstant()))
                    .build();
        } catch (IOException e) {
            throw new DbBackupException("Failed to read backup metadata: " + path.getFileName(), e);
        }
    }

    private Path resolveBackupDirectory() {
        Path backupDir = Paths.get(backupDirectory).toAbsolutePath().normalize();
        try {
            Files.createDirectories(backupDir);
        } catch (IOException e) {
            throw new DbBackupException("Failed to create backup directory: " + backupDir, e);
        }
        return backupDir;
    }

    private void runPgDump(JdbcConnectionInfo connectionInfo, Path outputFile) {
        if (useDocker) {
            runDockerPgDump(connectionInfo, outputFile);
            return;
        }

        runHostPgDump(connectionInfo, outputFile);
    }

    private void runDockerPgDump(JdbcConnectionInfo connectionInfo, Path outputFile) {
        if (dockerContainer == null || dockerContainer.isBlank()) {
            throw new DbBackupException("db-backup.docker-container must be set when use-docker is enabled.");
        }

        List<String> command = List.of(
                "docker", "exec", dockerContainer,
                "pg_dump",
                "-U", username,
                "-d", connectionInfo.databaseName()
        );

        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.redirectOutput(ProcessBuilder.Redirect.to(outputFile.toFile()));
        processBuilder.redirectError(ProcessBuilder.Redirect.PIPE);
        executeBackupProcessBuilder(processBuilder, outputFile, "docker exec pg_dump");
    }

    private void runHostPgDump(JdbcConnectionInfo connectionInfo, Path outputFile) {
        List<String> command = List.of(
                pgDumpCommand,
                "-h", connectionInfo.host(),
                "-p", connectionInfo.port(),
                "-U", username,
                "-d", connectionInfo.databaseName(),
                "-f", outputFile.toString(),
                "--no-password"
        );

        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.environment().put("PGPASSWORD", password);
        processBuilder.redirectError(ProcessBuilder.Redirect.PIPE);
        executeBackupProcessBuilder(processBuilder, outputFile, "pg_dump");
    }

    private void executeBackupProcessBuilder(ProcessBuilder processBuilder, Path outputFile, String processLabel) {
        try {
            log.info("Creating database backup at {} using {}", outputFile, processLabel);
            Process process = processBuilder.start();
            String errorOutput = readProcessOutput(process.getErrorStream());
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                Files.deleteIfExists(outputFile);
                throw new DbBackupException(
                        processLabel + " failed with exit code " + exitCode + ". " + errorOutput.trim()
                );
            }

            if (!Files.exists(outputFile) || Files.size(outputFile) == 0) {
                Files.deleteIfExists(outputFile);
                throw new DbBackupException(processLabel + " completed but the backup file is empty.");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new DbBackupException("Backup process was interrupted.", e);
        } catch (IOException e) {
            throw new DbBackupException(
                    "Failed to execute " + processLabel + ". Ensure Docker is running and the database container is up.",
                    e
            );
        }
    }

    private String readProcessOutput(Process process) throws IOException {
        return readProcessOutput(process.getInputStream());
    }

    private String readProcessOutput(java.io.InputStream inputStream) throws IOException {
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append(System.lineSeparator());
            }
        }
        return output.toString();
    }

    private JdbcConnectionInfo parseJdbcUrl(String url) {
        Matcher matcher = JDBC_URL_PATTERN.matcher(url);
        if (!matcher.matches()) {
            throw new DbBackupException("Unsupported datasource URL format: " + url);
        }

        String host = matcher.group(1);
        String port = matcher.group(2) != null ? matcher.group(2) : "5432";
        String databaseName = matcher.group(3);
        return new JdbcConnectionInfo(host, port, databaseName);
    }

    private record JdbcConnectionInfo(String host, String port, String databaseName) {
    }
}

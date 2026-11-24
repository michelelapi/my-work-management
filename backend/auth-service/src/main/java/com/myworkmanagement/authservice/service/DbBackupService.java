package com.myworkmanagement.authservice.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myworkmanagement.authservice.dto.BackupType;
import com.myworkmanagement.authservice.dto.DbBackupDTO;
import com.myworkmanagement.authservice.exception.DbBackupException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributes;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

@Service
@Slf4j
@RequiredArgsConstructor
public class DbBackupService {

    private static final Pattern JDBC_URL_PATTERN =
            Pattern.compile("jdbc:postgresql://([^:/]+)(?::(\\d+))?/([^?]+)");
    private static final DateTimeFormatter FILE_TIMESTAMP_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd_HHmmss").withZone(ZoneId.systemDefault());
    private static final DateTimeFormatter ISO_FORMAT = DateTimeFormatter.ISO_INSTANT;
    private static final String STATS_FILE_NAME = ".table-stats.json";
    private static final String DRIVE_META_FILE_NAME = ".drive-meta.json";
    private static final String TABLE_STATS_SQL = """
            SELECT schemaname, relname, n_tup_ins, n_tup_upd, n_tup_del
            FROM pg_stat_user_tables
            ORDER BY schemaname, relname
            """;

    private final GoogleDriveService googleDriveService;
    private final ObjectMapper objectMapper;

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
        return createBackup(BackupType.INCREMENTAL);
    }

    public DbBackupDTO createBackup(BackupType backupType) {
        BackupType type = backupType != null ? backupType : BackupType.INCREMENTAL;
        JdbcConnectionInfo connectionInfo = parseJdbcUrl(jdbcUrl);
        Path backupDir = resolveBackupDirectory();
        String timestamp = FILE_TIMESTAMP_FORMAT.format(Instant.now());
        String typePrefix = type == BackupType.FULL ? "FULL" : "INCREMENTAL";
        String fileName = typePrefix + "_" + connectionInfo.databaseName() + "_" + timestamp + ".sql";
        Path outputFile = backupDir.resolve(fileName);

        Map<String, TableStats> currentStats = loadCurrentTableStats();

        if (type == BackupType.FULL) {
            runPgDump(connectionInfo, outputFile, List.of(), false);
        } else {
            createIncrementalBackup(connectionInfo, outputFile, currentStats);
        }

        saveTableStats(backupDir, currentStats);

        try {
            BasicFileAttributes attributes = Files.readAttributes(outputFile, BasicFileAttributes.class);
            DbBackupDTO.DbBackupDTOBuilder builder = DbBackupDTO.builder()
                    .fileName(fileName)
                    .databaseName(connectionInfo.databaseName())
                    .sizeBytes(attributes.size())
                    .createdAt(ISO_FORMAT.format(attributes.creationTime().toInstant()))
                    .backupType(type)
                    .uploadedToGoogleDrive(false);

            googleDriveService.uploadBackup(outputFile).ifPresent(upload -> {
                builder.uploadedToGoogleDrive(true)
                        .googleDriveFileId(upload.fileId())
                        .googleDriveWebViewLink(upload.webViewLink());
                saveDriveMeta(backupDir, fileName, upload.fileId(), upload.webViewLink());
            });

            return builder.build();
        } catch (IOException e) {
            throw new DbBackupException("Backup created but failed to read file metadata: " + fileName, e);
        }
    }

    public List<DbBackupDTO> listBackups() {
        Path backupDir = resolveBackupDirectory();
        Map<String, DriveMeta> driveMetaByFile = readDriveMeta(backupDir);
        List<DbBackupDTO> backups = new ArrayList<>();

        try (Stream<Path> files = Files.list(backupDir)) {
            files.filter(path -> Files.isRegularFile(path) && path.getFileName().toString().endsWith(".sql"))
                    .forEach(path -> backups.add(toDto(path, driveMetaByFile.get(path.getFileName().toString()))));
        } catch (IOException e) {
            throw new DbBackupException("Failed to list database backups", e);
        }

        backups.sort(Comparator.comparing(DbBackupDTO::getCreatedAt).reversed());
        return backups;
    }

    private void createIncrementalBackup(
            JdbcConnectionInfo connectionInfo,
            Path outputFile,
            Map<String, TableStats> currentStats
    ) {
        Path statsFile = resolveBackupDirectory().resolve(STATS_FILE_NAME);
        if (!Files.exists(statsFile)) {
            throw new DbBackupException(
                    "No baseline found for incremental backup. Create an entire (full) database backup first."
            );
        }

        Map<String, TableStats> previousStats = readTableStats(statsFile);
        List<String> changedTables = findChangedTables(previousStats, currentStats);

        if (changedTables.isEmpty()) {
            writeNoChangesIncrementalFile(outputFile);
            return;
        }

        log.info("Incremental backup will include {} changed table(s): {}", changedTables.size(), changedTables);
        runPgDump(connectionInfo, outputFile, changedTables, true);
    }

    private List<String> findChangedTables(
            Map<String, TableStats> previousStats,
            Map<String, TableStats> currentStats
    ) {
        List<String> changed = new ArrayList<>();
        for (Map.Entry<String, TableStats> entry : currentStats.entrySet()) {
            TableStats previous = previousStats.get(entry.getKey());
            if (previous == null || entry.getValue().isMoreActiveThan(previous)) {
                changed.add(entry.getKey());
            }
        }
        return changed;
    }

    private void writeNoChangesIncrementalFile(Path outputFile) {
        try {
            String content = """
                    -- Incremental backup
                    -- No user-table changes detected since the last backup baseline.
                    """;
            Files.writeString(outputFile, content, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new DbBackupException("Failed to write empty incremental backup file", e);
        }
    }

    private Map<String, TableStats> loadCurrentTableStats() {
        Map<String, TableStats> stats = new LinkedHashMap<>();
        try (Connection connection = DriverManager.getConnection(jdbcUrl, username, password);
             PreparedStatement statement = connection.prepareStatement(TABLE_STATS_SQL);
             ResultSet resultSet = statement.executeQuery()) {
            while (resultSet.next()) {
                String key = resultSet.getString("schemaname") + "." + resultSet.getString("relname");
                stats.put(key, new TableStats(
                        resultSet.getLong("n_tup_ins"),
                        resultSet.getLong("n_tup_upd"),
                        resultSet.getLong("n_tup_del")
                ));
            }
        } catch (Exception e) {
            throw new DbBackupException("Failed to read table change statistics for backup", e);
        }
        return stats;
    }

    private void saveTableStats(Path backupDir, Map<String, TableStats> stats) {
        try {
            objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValue(backupDir.resolve(STATS_FILE_NAME).toFile(), stats);
        } catch (IOException e) {
            throw new DbBackupException("Backup created but failed to update table stats baseline", e);
        }
    }

    private Map<String, TableStats> readTableStats(Path statsFile) {
        try {
            return objectMapper.readValue(statsFile.toFile(), new TypeReference<Map<String, TableStats>>() {
            });
        } catch (IOException e) {
            throw new DbBackupException("Failed to read table stats baseline from " + statsFile, e);
        }
    }

    private DbBackupDTO toDto(Path path, DriveMeta driveMeta) {
        try {
            BasicFileAttributes attributes = Files.readAttributes(path, BasicFileAttributes.class);
            String fileName = path.getFileName().toString();
            BackupType backupType = resolveBackupType(fileName);
            String databaseName = resolveDatabaseName(fileName);

            DbBackupDTO.DbBackupDTOBuilder builder = DbBackupDTO.builder()
                    .fileName(fileName)
                    .databaseName(databaseName)
                    .sizeBytes(attributes.size())
                    .createdAt(ISO_FORMAT.format(attributes.creationTime().toInstant()))
                    .backupType(backupType)
                    .uploadedToGoogleDrive(false);

            if (driveMeta != null && driveMeta.getFileId() != null && !driveMeta.getFileId().isBlank()) {
                String link = driveMeta.getWebViewLink();
                if (link == null || link.isBlank()) {
                    link = "https://drive.google.com/file/d/" + driveMeta.getFileId() + "/view";
                }
                builder.uploadedToGoogleDrive(true)
                        .googleDriveFileId(driveMeta.getFileId())
                        .googleDriveWebViewLink(link);
            }

            return builder.build();
        } catch (IOException e) {
            throw new DbBackupException("Failed to read backup metadata: " + path.getFileName(), e);
        }
    }

    private void saveDriveMeta(Path backupDir, String fileName, String fileId, String webViewLink) {
        try {
            Map<String, DriveMeta> meta = readDriveMeta(backupDir);
            meta.put(fileName, new DriveMeta(fileId, webViewLink));
            objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValue(backupDir.resolve(DRIVE_META_FILE_NAME).toFile(), meta);
        } catch (IOException e) {
            log.warn("Backup uploaded to Drive but failed to persist drive metadata for {}: {}", fileName, e.getMessage());
        }
    }

    private Map<String, DriveMeta> readDriveMeta(Path backupDir) {
        Path metaFile = backupDir.resolve(DRIVE_META_FILE_NAME);
        if (!Files.exists(metaFile)) {
            return new LinkedHashMap<>();
        }
        try {
            Map<String, DriveMeta> meta = objectMapper.readValue(
                    metaFile.toFile(),
                    new TypeReference<Map<String, DriveMeta>>() {
                    }
            );
            return meta != null ? meta : new LinkedHashMap<>();
        } catch (IOException e) {
            log.warn("Failed to read Drive metadata from {}: {}", metaFile, e.getMessage());
            return new LinkedHashMap<>();
        }
    }

    private BackupType resolveBackupType(String fileName) {
        if (fileName.startsWith("INCREMENTAL_") || fileName.contains("_incremental_")) {
            return BackupType.INCREMENTAL;
        }
        if (fileName.startsWith("FULL_") || fileName.contains("_full_")) {
            return BackupType.FULL;
        }
        return BackupType.FULL;
    }

    private String resolveDatabaseName(String fileName) {
        String withoutExtension = fileName.endsWith(".sql")
                ? fileName.substring(0, fileName.length() - 4)
                : fileName;

        if (withoutExtension.startsWith("FULL_")) {
            withoutExtension = withoutExtension.substring("FULL_".length());
        } else if (withoutExtension.startsWith("INCREMENTAL_")) {
            withoutExtension = withoutExtension.substring("INCREMENTAL_".length());
        } else {
            int fullIdx = withoutExtension.indexOf("_full_");
            if (fullIdx > 0) {
                return withoutExtension.substring(0, fullIdx);
            }
            int incrementalIdx = withoutExtension.indexOf("_incremental_");
            if (incrementalIdx > 0) {
                return withoutExtension.substring(0, incrementalIdx);
            }
        }

        // Strip trailing _yyyy-MM-dd_HHmmss timestamp when present
        Matcher timestampMatcher = Pattern.compile("^(.*)_(?:\\d{4}-\\d{2}-\\d{2}_\\d{6})$")
                .matcher(withoutExtension);
        if (timestampMatcher.matches()) {
            return timestampMatcher.group(1);
        }

        int underscore = withoutExtension.indexOf('_');
        return underscore > 0 ? withoutExtension.substring(0, underscore) : withoutExtension;
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

    private void runPgDump(
            JdbcConnectionInfo connectionInfo,
            Path outputFile,
            List<String> tables,
            boolean dataOnly
    ) {
        if (useDocker) {
            runDockerPgDump(connectionInfo, outputFile, tables, dataOnly);
            return;
        }
        runHostPgDump(connectionInfo, outputFile, tables, dataOnly);
    }

    private void runDockerPgDump(
            JdbcConnectionInfo connectionInfo,
            Path outputFile,
            List<String> tables,
            boolean dataOnly
    ) {
        if (dockerContainer == null || dockerContainer.isBlank()) {
            throw new DbBackupException("db-backup.docker-container must be set when use-docker is enabled.");
        }

        List<String> command = new ArrayList<>();
        command.add("docker");
        command.add("exec");
        command.add(dockerContainer);
        command.add("pg_dump");
        command.add("-U");
        command.add(username);
        command.add("-d");
        command.add(connectionInfo.databaseName());
        if (dataOnly) {
            command.add("--data-only");
            command.add("--column-inserts");
        }
        for (String table : tables) {
            command.add("-t");
            command.add(table);
        }

        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.redirectOutput(ProcessBuilder.Redirect.to(outputFile.toFile()));
        processBuilder.redirectError(ProcessBuilder.Redirect.PIPE);
        executeBackupProcessBuilder(processBuilder, outputFile, "docker exec pg_dump");
    }

    private void runHostPgDump(
            JdbcConnectionInfo connectionInfo,
            Path outputFile,
            List<String> tables,
            boolean dataOnly
    ) {
        List<String> command = new ArrayList<>();
        command.add(pgDumpCommand);
        command.add("-h");
        command.add(connectionInfo.host());
        command.add("-p");
        command.add(connectionInfo.port());
        command.add("-U");
        command.add(username);
        command.add("-d");
        command.add(connectionInfo.databaseName());
        command.add("-f");
        command.add(outputFile.toString());
        command.add("--no-password");
        if (dataOnly) {
            command.add("--data-only");
            command.add("--column-inserts");
        }
        for (String table : tables) {
            command.add("-t");
            command.add(table);
        }

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

    public static class DriveMeta {
        private String fileId;
        private String webViewLink;

        public DriveMeta() {
        }

        public DriveMeta(String fileId, String webViewLink) {
            this.fileId = fileId;
            this.webViewLink = webViewLink;
        }

        public String getFileId() {
            return fileId;
        }

        public void setFileId(String fileId) {
            this.fileId = fileId;
        }

        public String getWebViewLink() {
            return webViewLink;
        }

        public void setWebViewLink(String webViewLink) {
            this.webViewLink = webViewLink;
        }
    }

    public static class TableStats {
        private long n_tup_ins;
        private long n_tup_upd;
        private long n_tup_del;

        public TableStats() {
        }

        public TableStats(long n_tup_ins, long n_tup_upd, long n_tup_del) {
            this.n_tup_ins = n_tup_ins;
            this.n_tup_upd = n_tup_upd;
            this.n_tup_del = n_tup_del;
        }

        public long getN_tup_ins() {
            return n_tup_ins;
        }

        public void setN_tup_ins(long n_tup_ins) {
            this.n_tup_ins = n_tup_ins;
        }

        public long getN_tup_upd() {
            return n_tup_upd;
        }

        public void setN_tup_upd(long n_tup_upd) {
            this.n_tup_upd = n_tup_upd;
        }

        public long getN_tup_del() {
            return n_tup_del;
        }

        public void setN_tup_del(long n_tup_del) {
            this.n_tup_del = n_tup_del;
        }

        boolean isMoreActiveThan(TableStats other) {
            return n_tup_ins > other.n_tup_ins
                    || n_tup_upd > other.n_tup_upd
                    || n_tup_del > other.n_tup_del;
        }
    }
}

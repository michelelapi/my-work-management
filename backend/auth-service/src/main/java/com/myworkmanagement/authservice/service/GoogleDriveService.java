package com.myworkmanagement.authservice.service;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.FileContent;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.api.services.drive.model.File;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * Uploads DB backups to the user's Google Drive using the same OAuth token as company-service.
 * Service accounts cannot upload to personal Drive (zero storage quota).
 */
@Service
@Slf4j
public class GoogleDriveService {

    private static final String APPLICATION_NAME = "MyWorkManagement-AuthService";
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final String OAUTH_USER_ID = "user";
    private static final List<String> SCOPES = Collections.singletonList(DriveScopes.DRIVE_FILE);

    @Value("${google.drive.backup-folder-id:}")
    private String backupFolderId;

    @Value("${google.drive.oauth-client-path:../company-service/src/main/resources/google-drive-oauth-client.json}")
    private String oauthClientPath;

    @Value("${google.drive.token-directory:../company-service/src/main/resources/google-drive-tokens}")
    private String tokenDirectory;

    private Drive driveService;

    @PostConstruct
    public void init() {
        try {
            if (backupFolderId == null || backupFolderId.isBlank()) {
                log.warn("google.drive.backup-folder-id is not set. Drive uploads will be skipped.");
                return;
            }
            if (!Files.exists(Path.of(oauthClientPath))) {
                log.warn(
                        "Google Drive OAuth client file not found at {}. Drive uploads will be skipped.",
                        oauthClientPath
                );
                return;
            }

            Credential credential = loadExistingCredential();
            if (credential == null) {
                log.warn(
                        "Google Drive is not authorized yet. Run company-service GoogleDriveAuthSetup once. "
                                + "Drive uploads will be skipped until then."
                );
                return;
            }

            driveService = new Drive.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    JSON_FACTORY,
                    credential
            )
                    .setApplicationName(APPLICATION_NAME)
                    .build();
            log.info("Google Drive service initialized with OAuth user credentials (folderId={})", backupFolderId);
        } catch (Exception e) {
            driveService = null;
            log.error("Failed to initialize Google Drive service. Local backups will still work.", e);
        }
    }

    public Optional<DriveUploadResult> uploadBackup(Path localFile) {
        if (driveService == null) {
            log.warn("Skipping Google Drive upload for {}: Drive service is not available", localFile.getFileName());
            return Optional.empty();
        }

        try {
            File metadata = new File();
            metadata.setName(localFile.getFileName().toString());
            metadata.setParents(Collections.singletonList(backupFolderId.trim()));

            FileContent mediaContent = new FileContent("application/sql", localFile.toFile());
            File uploaded = driveService.files()
                    .create(metadata, mediaContent)
                    .setFields("id, name, webViewLink")
                    .setSupportsAllDrives(true)
                    .execute();

            String webViewLink = uploaded.getWebViewLink();
            if (webViewLink == null || webViewLink.isBlank()) {
                webViewLink = "https://drive.google.com/file/d/" + uploaded.getId() + "/view";
            }
            log.info("Uploaded backup {} to Google Drive (fileId={})", uploaded.getName(), uploaded.getId());
            return Optional.of(new DriveUploadResult(uploaded.getId(), webViewLink));
        } catch (Exception e) {
            log.error("Failed to upload backup {} to Google Drive: {}", localFile.getFileName(), e.getMessage(), e);
            return Optional.empty();
        }
    }

    private Credential loadExistingCredential() throws Exception {
        NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        GoogleClientSecrets clientSecrets;
        try (InputStreamReader reader = new InputStreamReader(
                new FileInputStream(oauthClientPath), StandardCharsets.UTF_8)) {
            clientSecrets = GoogleClientSecrets.load(JSON_FACTORY, reader);
        }

        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                httpTransport,
                JSON_FACTORY,
                clientSecrets,
                SCOPES
        )
                .setDataStoreFactory(new FileDataStoreFactory(new java.io.File(tokenDirectory)))
                .setAccessType("offline")
                .build();

        return flow.loadCredential(OAUTH_USER_ID);
    }

    public record DriveUploadResult(String fileId, String webViewLink) {
    }
}

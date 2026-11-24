package com.myworkmanagement.company.service;

import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.drive.DriveScopes;

import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;

/**
 * One-time Google Drive OAuth setup.
 *
 * <p>Prerequisites:
 * <ol>
 *   <li>In Google Cloud Console (same project as Sheets), enable Google Drive API.</li>
 *   <li>Create OAuth client ID of type <b>Desktop app</b>.</li>
 *   <li>Download the JSON and save it as
 *       {@code backend/company-service/src/main/resources/google-drive-oauth-client.json}</li>
 *   <li>Configure OAuth consent screen and add your Google account as a test user if the app is in testing.</li>
 * </ol>
 *
 * <p>Run from {@code backend/company-service}:
 * <pre>
 * mvn -q exec:java -Dexec.mainClass=com.myworkmanagement.company.service.GoogleDriveAuthSetup
 * </pre>
 * A browser window opens; sign in with the Google account that owns the backup folder.
 * After success, restart company-service and auth-service.
 */
public final class GoogleDriveAuthSetup {

    private static final String OAUTH_CLIENT_PATH = "src/main/resources/google-drive-oauth-client.json";
    private static final String TOKEN_DIRECTORY = "src/main/resources/google-drive-tokens";
    private static final int RECEIVER_PORT = 8888;

    private GoogleDriveAuthSetup() {
    }

    public static void main(String[] args) throws Exception {
        Path clientPath = Path.of(OAUTH_CLIENT_PATH);
        if (!Files.exists(clientPath)) {
            System.err.println("Missing OAuth client file: " + clientPath.toAbsolutePath());
            System.err.println("Create a Desktop OAuth client in Google Cloud Console and save the JSON there.");
            System.exit(1);
        }

        NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        GoogleClientSecrets clientSecrets;
        try (InputStreamReader reader = new InputStreamReader(
                new FileInputStream(clientPath.toFile()), StandardCharsets.UTF_8)) {
            clientSecrets = GoogleClientSecrets.load(GsonFactory.getDefaultInstance(), reader);
        }

        Path tokenDir = Path.of(TOKEN_DIRECTORY);
        Files.createDirectories(tokenDir);

        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                httpTransport,
                GsonFactory.getDefaultInstance(),
                clientSecrets,
                Collections.singletonList(DriveScopes.DRIVE_FILE)
        )
                .setDataStoreFactory(new FileDataStoreFactory(tokenDir.toFile()))
                .setAccessType("offline")
                .build();

        LocalServerReceiver receiver = new LocalServerReceiver.Builder()
                .setPort(RECEIVER_PORT)
                .build();

        new AuthorizationCodeInstalledApp(flow, receiver).authorize("user");
        System.out.println("Google Drive authorization successful.");
        System.out.println("Token stored in: " + tokenDir.toAbsolutePath());
        System.out.println("Restart company-service and auth-service, then create a backup again.");
    }
}

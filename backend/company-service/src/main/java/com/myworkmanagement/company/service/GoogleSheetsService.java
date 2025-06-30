package com.myworkmanagement.company.service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.api.services.sheets.v4.model.*;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;

import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.*;

@Service
public class GoogleSheetsService {
    private static final String APPLICATION_NAME = "MyWorkManagement-CompanyService";
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final String CREDENTIALS_FILE_PATH = "src/main/resources/google-sheets-credentials.json";
    private static final String SHEET_ID = "1I0oNLXK7m5dVXsmGin_zc4cGXqTbqTmkk9lgAcu4gvo"; // TODO: Replace with your actual Sheet ID
    private static final String SHEET_NAME = "Tasks"; // TODO: Replace with your actual Sheet name

    private Sheets sheetsService;

    public GoogleSheetsService() {
        try {
            sheetsService = getSheetsService();
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize Google Sheets service", e);
        }
    }

    private Sheets getSheetsService() throws IOException, GeneralSecurityException {
        GoogleCredentials credentials = GoogleCredentials.fromStream(new FileInputStream(CREDENTIALS_FILE_PATH))
                .createScoped(Collections.singleton(SheetsScopes.SPREADSHEETS));
        return new Sheets.Builder(GoogleNetHttpTransport.newTrustedTransport(), JSON_FACTORY, new HttpCredentialsAdapter(credentials))
                .setApplicationName(APPLICATION_NAME)
                .build();
    }



    public void addTaskRow(List<Object> rowData) {
        try {
            //Insert a new empty row after the header
            InsertDimensionRequest insertRequest = new InsertDimensionRequest()
                .setRange(new DimensionRange()
                    .setSheetId(0)
                    .setDimension("ROWS")
                    .setStartIndex(1)
                    .setEndIndex(2))
                .setInheritFromBefore(false);

            Request request = new Request().setInsertDimension(insertRequest);
            
            BatchUpdateSpreadsheetRequest batchRequest = new BatchUpdateSpreadsheetRequest()
                .setRequests(Arrays.asList(request));

            sheetsService.spreadsheets().batchUpdate(SHEET_ID, batchRequest).execute();

            //Copy the task values in the empty row before inserted
            ValueRange updateBody = new ValueRange().setValues(Collections.singletonList(rowData));
            sheetsService.spreadsheets().values()
                    .update(SHEET_ID, SHEET_NAME + "!A2:K2", updateBody)
                    .setValueInputOption("USER_ENTERED")
                    .execute();
        } catch (Exception e) {
            throw new RuntimeException("Failed to add row to Google Sheet", e);
        }
    }

    public void updateTaskRowByTicketId(String ticketId, List<Object> rowData) {
        try {
            Integer rowIndex = findRowIndexByTicketId(ticketId);
            if (rowIndex == null) {
                throw new RuntimeException("TicketId not found in sheet: " + ticketId);
            }
            String range = SHEET_NAME + "!A" + (rowIndex + 1) + ":K" + (rowIndex + 1);
            ValueRange body = new ValueRange().setValues(Collections.singletonList(rowData));
            sheetsService.spreadsheets().values()
                    .update(SHEET_ID, range, body)
                    .setValueInputOption("USER_ENTERED")
                    .execute();
        } catch (Exception e) {
            throw new RuntimeException("Failed to update row in Google Sheet", e);
        }
    }

    public void deleteTaskRowByTicketId(String ticketId) {
        try {
            Integer rowIndex = findRowIndexByTicketId(ticketId);
            if (rowIndex == null) {
                throw new RuntimeException("TicketId not found in sheet: " + ticketId);
            }
            // Google Sheets API does not have a direct delete row by value, so we use batchUpdate
            BatchUpdateSpreadsheetRequest batchUpdateRequest = new BatchUpdateSpreadsheetRequest()
                    .setRequests(Collections.singletonList(
                            new Request().setDeleteDimension(
                                    new DeleteDimensionRequest()
                                            .setRange(new DimensionRange()
                                                    .setSheetId(getSheetGid())
                                                    .setDimension("ROWS")
                                                    .setStartIndex(rowIndex)
                                                    .setEndIndex(rowIndex + 1)
                                            )
                                    )
                            )
                    );
            sheetsService.spreadsheets().batchUpdate(SHEET_ID, batchUpdateRequest).execute();
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete row in Google Sheet", e);
        }
    }

    private Integer findRowIndexByTicketId(String ticketId) throws IOException {
        ValueRange response = sheetsService.spreadsheets().values()
                .get(SHEET_ID, SHEET_NAME + "!A:K")
                .execute();
        List<List<Object>> values = response.getValues();
        if (values == null) return null;
        for (int i = 0; i < values.size(); i++) {
            if (values.get(i).size() > 2 && ticketId.equals(values.get(i).get(2))) { // ticketId is column C (index 2)
                return i;
            }
        }
        return null;
    }

    private Integer getSheetGid() throws IOException {
        Spreadsheet spreadsheet = sheetsService.spreadsheets().get(SHEET_ID).execute();
        for (Sheet sheet : spreadsheet.getSheets()) {
            if (SHEET_NAME.equals(sheet.getProperties().getTitle())) {
                return sheet.getProperties().getSheetId();
            }
        }
        throw new RuntimeException("Sheet name not found: " + SHEET_NAME);
    }
} 
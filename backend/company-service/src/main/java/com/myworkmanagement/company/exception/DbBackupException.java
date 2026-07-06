package com.myworkmanagement.company.exception;

public class DbBackupException extends RuntimeException {

    public DbBackupException(String message) {
        super(message);
    }

    public DbBackupException(String message, Throwable cause) {
        super(message, cause);
    }
}

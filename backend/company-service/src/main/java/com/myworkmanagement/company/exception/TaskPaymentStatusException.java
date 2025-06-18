package com.myworkmanagement.company.exception;

public class TaskPaymentStatusException extends RuntimeException {
    public TaskPaymentStatusException(String message) {
        super(message);
    }

    public TaskPaymentStatusException(String message, Throwable cause) {
        super(message, cause);
    }
} 
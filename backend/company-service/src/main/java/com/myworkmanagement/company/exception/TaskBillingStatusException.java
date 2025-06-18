package com.myworkmanagement.company.exception;

public class TaskBillingStatusException extends RuntimeException {
    public TaskBillingStatusException(String message) {
        super(message);
    }

    public TaskBillingStatusException(String message, Throwable cause) {
        super(message, cause);
    }
} 
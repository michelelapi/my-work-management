package com.myworkmanagement.authservice.service;

import com.myworkmanagement.authservice.dto.request.LoginRequest;
import com.myworkmanagement.authservice.dto.request.UserRegistrationRequest;
import com.myworkmanagement.authservice.dto.response.AuthResponse;
import com.myworkmanagement.authservice.dto.response.UserResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    UserResponse register(UserRegistrationRequest request);
} 
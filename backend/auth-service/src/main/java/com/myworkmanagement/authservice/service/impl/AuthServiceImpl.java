package com.myworkmanagement.authservice.service.impl;

import com.myworkmanagement.authservice.dto.request.LoginRequest;
import com.myworkmanagement.authservice.dto.request.UserRegistrationRequest;
import com.myworkmanagement.authservice.dto.response.AuthResponse;
import com.myworkmanagement.authservice.dto.response.UserResponse;
import com.myworkmanagement.authservice.entity.Role;
import com.myworkmanagement.authservice.entity.User;
import com.myworkmanagement.authservice.exception.EmailAlreadyExistsException;
import com.myworkmanagement.authservice.repository.UserRepository;
import com.myworkmanagement.authservice.security.JwtTokenProvider;
import com.myworkmanagement.authservice.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // Get the authenticated user principal
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        
        // Fetch the full user entity from the repository
        User user = userRepository.findByEmail(userDetails.getUsername())
                        .orElseThrow(() -> new RuntimeException("User not found")); // Should not happen if authentication was successful

        // Generate JWT token
        String token = tokenProvider.generateToken(authentication);
        
        // Build UserResponse DTO
        UserResponse userResponse = UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .role(user.getRole().name())
            .build();

        // Return AuthResponse with token and user details
        return new AuthResponse(token, userResponse);
    }

    @Override
    @Transactional
    public UserResponse register(UserRegistrationRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email already exists");
        }

        User user = User.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .role(Role.USER)
            .build();

        user = userRepository.save(user);

        return UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .role(user.getRole().name())
            .build();
    }
} 
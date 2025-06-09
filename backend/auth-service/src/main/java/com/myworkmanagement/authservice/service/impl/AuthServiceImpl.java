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
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Override
    public AuthResponse login(LoginRequest request) {
        try {
            log.info("Attempting login for user: {}", request.getEmail());
            
            // First authenticate the user
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            // Get the authenticated user principal
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            log.info("User authenticated successfully: {}", userDetails.getUsername());
            
            // Fetch the full user entity from the repository
            User user = userRepository.findByEmail(userDetails.getUsername())
                            .orElseThrow(() -> {
                                log.error("User not found in database after successful authentication: {}", userDetails.getUsername());
                                return new RuntimeException("User not found");
                            });

            log.info("User found in database with role: {}", user.getRole());

            // Generate JWT token with the authentication object that contains UserDetails
            String token = tokenProvider.generateToken(authentication);
            log.info("JWT token generated successfully for user: {}", user.getEmail());
            
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
            
        } catch (BadCredentialsException e) {
            log.error("Invalid credentials for user: {}", request.getEmail());
            throw new RuntimeException("Invalid email or password");
        } catch (Exception e) {
            log.error("Error during login process: {}", e.getMessage(), e);
            throw new RuntimeException("An error occurred during login");
        }
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
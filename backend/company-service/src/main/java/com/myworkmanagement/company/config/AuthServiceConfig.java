package com.myworkmanagement.company.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AuthServiceConfig {

    @Value("${auth-service.url}")
    private String authServiceUrl;

    @Value("${auth-service.validate-token-path}")
    private String validateTokenPath;

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    public String getAuthServiceUrl() {
        return authServiceUrl;
    }

    public String getValidateTokenPath() {
        return validateTokenPath;
    }
} 
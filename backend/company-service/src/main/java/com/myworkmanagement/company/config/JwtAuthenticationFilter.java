package com.myworkmanagement.company.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        String authHeader = request.getHeader("Authorization");
        logger.info("Processing request to: " + request.getRequestURI());
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("No Bearer token found in request");
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String jwt = authHeader.substring(7);
            logger.info("JWT token received: " + jwt.substring(0, 20) + "...");
            
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(jwt)
                    .getBody();

            String username = claims.getSubject();
            logger.info("Username from token: " + username);
            
            // Handle authorities safely
            List<SimpleGrantedAuthority> grantedAuthorities = new ArrayList<>();
            if (claims.get("authorities") != null) {
                @SuppressWarnings("unchecked")
                List<String> authorities = claims.get("authorities", List.class);
                if (authorities != null) {
                    grantedAuthorities = authorities.stream()
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());
                    logger.info("Authorities found: " + grantedAuthorities);
                } else {
                    logger.warn("Authorities claim is null");
                }
            } else {
                logger.warn("No authorities claim found in token");
            }

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    username,
                    null,
                    grantedAuthorities
            );

            SecurityContextHolder.getContext().setAuthentication(auth);
            logger.info("Authentication set in SecurityContext");
            
        } catch (ExpiredJwtException e) {
            logger.warn("JWT token has expired: " + e.getMessage());
            SecurityContextHolder.clearContext();
            // Return 401 Unauthorized for expired tokens
            handleUnauthorizedResponse(response, "JWT token has expired");
            return;
        } catch (Exception e) {
            logger.error("Cannot set user authentication: " + e.getMessage(), e);
            SecurityContextHolder.clearContext();
            // For other JWT errors, also return 401
            if (e instanceof io.jsonwebtoken.JwtException) {
                handleUnauthorizedResponse(response, "Invalid JWT token: " + e.getMessage());
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private void handleUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("status", 401);
        errorResponse.put("error", "Unauthorized");
        errorResponse.put("message", message);
        errorResponse.put("path", "");
        
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.writeValue(response.getWriter(), errorResponse);
    }
} 
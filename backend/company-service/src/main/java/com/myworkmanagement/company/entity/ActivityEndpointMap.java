package com.myworkmanagement.company.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "activity_endpoint_map")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityEndpointMap {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "activity_name", nullable = false)
    private String activityName;

    @Column(name = "endpoint_pattern", nullable = false)
    private String endpointPattern;

    @Column(name = "http_method", nullable = false)
    private String httpMethod;

    @Column(nullable = false)
    private Boolean enabled;

    @CreationTimestamp
    @Column(name = "creation_date", nullable = false, updatable = false)
    private LocalDateTime creationDate;
}

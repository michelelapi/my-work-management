package com.myworkmanagement.company.config;

import com.myworkmanagement.company.entity.CompanyStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class CompanyStatusConverter implements AttributeConverter<CompanyStatus, String> {

    @Override
    public String convertToDatabaseColumn(CompanyStatus status) {
        if (status == null) {
            return null;
        }
        return status.name();
    }

    @Override
    public CompanyStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            return CompanyStatus.valueOf(dbData);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid company status: " + dbData);
        }
    }
} 
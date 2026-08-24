package com.example.BreatheESG.parser;


import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class ParseResult {

    // Did parsing succeed?
    private boolean success;
    private boolean suspicious;
    private String errorMessage;
    private String flagReason;

    // Raw values exactly as found in CSV
    private String rawJson;        // entire row as JSON string
    private BigDecimal rawValue;
    private String rawUnit;

    // Normalized values
    private BigDecimal normalizedValue;
    private String normalizedUnit;

    // Carbon calculation
    private BigDecimal emissionFactor;
    private String emissionFactorSource;
    private BigDecimal co2eKg;

    // Metadata
    private String description;
    private String category;
    private String scope;          // SCOPE_1, SCOPE_2, SCOPE_3
    private LocalDate activityDate;
    private LocalDate periodStart;
    private LocalDate periodEnd;
}
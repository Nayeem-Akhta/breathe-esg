package com.example.BreatheESG.parser;

import com.opencsv.CSVReader;
import org.springframework.stereotype.Component;
import java.io.InputStreamReader;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Component
public class UtilityParser {

    // ── Grid emission factors (CEA India 2023) ─────────
    private static final Map<String, BigDecimal> GRID_FACTORS = Map.of(
            "IN_SOUTH", new BigDecimal("0.7082"),
            "IN_WEST",  new BigDecimal("0.8205"),
            "IN_NORTH", new BigDecimal("0.7952"),
            "IN_EAST",  new BigDecimal("0.9163")
    );
    private static final BigDecimal DEFAULT_FACTOR = new BigDecimal("0.7800");
    private static final String DEFAULT_SOURCE = "CEA India 2023 (national avg)";

    // ── Unit conversions to kWh ────────────────────────
    private static final Map<String, BigDecimal> UNIT_TO_KWH = Map.of(
            "KWH", new BigDecimal("1.0"),
            "MWH", new BigDecimal("1000.0"),
            "GWH", new BigDecimal("1000000.0")
    );

    public List<ParseResult> parse(InputStream inputStream) {
        List<ParseResult> results = new ArrayList<>();
        Set<String> seenPeriods  = new HashSet<>();

        try (CSVReader reader = new CSVReader(new InputStreamReader(inputStream))) {
            List<String[]> rows = reader.readAll();
            if (rows.isEmpty()) return results;

            String[] headers = rows.get(0);

            for (int i = 1; i < rows.size(); i++) {
                String[] row = rows.get(i);
                ParseResult result = parseRow(headers, row, seenPeriods);
                results.add(result);
            }

        } catch (Exception e) {
            results.add(ParseResult.builder()
                    .success(false)
                    .errorMessage("Could not read file: " + e.getMessage())
                    .build());
        }

        return results;
    }

    private ParseResult parseRow(String[] headers, String[] values, Set<String> seenPeriods) {
        Map<String, String> row = new LinkedHashMap<>();
        for (int i = 0; i < headers.length && i < values.length; i++) {
            row.put(headers[i].trim().toLowerCase(), values[i] != null ? values[i].trim() : "");
        }

        String rawJson = mapToJson(row);

        // ── Parse consumption ──────────────────────────
        String consumptionRaw = row.getOrDefault("consumption_kwh", "").trim();
        if (consumptionRaw.isEmpty() || consumptionRaw.equalsIgnoreCase("null")) {
            return ParseResult.builder()
                    .success(false)
                    .rawJson(rawJson)
                    .errorMessage("Missing consumption value")
                    .build();
        }

        BigDecimal rawValue;
        try {
            rawValue = new BigDecimal(consumptionRaw);
        } catch (NumberFormatException e) {
            return ParseResult.builder()
                    .success(false)
                    .rawJson(rawJson)
                    .errorMessage("Invalid consumption: " + consumptionRaw)
                    .build();
        }

        // ── Parse unit ────────────────────────────────
        String rawUnit = row.getOrDefault("consumption_unit", "KWH").trim().toUpperCase();
        BigDecimal conversion = UNIT_TO_KWH.getOrDefault(rawUnit, BigDecimal.ONE);
        BigDecimal normalizedValue = rawValue.multiply(conversion).setScale(4, RoundingMode.HALF_UP);

        // ── Parse billing period ──────────────────────
        LocalDate periodStart;
        LocalDate periodEnd;
        try {
            periodStart = LocalDate.parse(row.getOrDefault("billing_period_start", "").trim());
            periodEnd   = LocalDate.parse(row.getOrDefault("billing_period_end", "").trim());
        } catch (Exception e) {
            return ParseResult.builder()
                    .success(false)
                    .rawJson(rawJson)
                    .errorMessage("Invalid billing period dates")
                    .build();
        }

        // ── Detect overlapping periods ────────────────
        String meterId  = row.getOrDefault("meter_id", "").trim();
        String periodKey = meterId + "_" + periodStart;
        boolean flagged  = false;
        String flagReason = "";

        if (seenPeriods.contains(periodKey)) {
            flagged    = true;
            flagReason = "Overlapping billing period for meter " + meterId;
        } else {
            seenPeriods.add(periodKey);
        }

        // ── Emission factor by grid zone ──────────────
        String gridZone = row.getOrDefault("grid_zone", "DEFAULT").trim();
        BigDecimal ef   = GRID_FACTORS.getOrDefault(gridZone, DEFAULT_FACTOR);
        String efSource = GRID_FACTORS.containsKey(gridZone)
                ? "CEA India 2023" : DEFAULT_SOURCE;

        BigDecimal co2eKg = normalizedValue.multiply(ef).setScale(4, RoundingMode.HALF_UP);

        String siteName   = row.getOrDefault("site_name", "Unknown Site").trim();
        String description = "Electricity - " + siteName;

        return ParseResult.builder()
                .success(true)
                .suspicious(flagged)
                .flagReason(flagReason)
                .rawJson(rawJson)
                .rawValue(rawValue)
                .rawUnit(rawUnit)
                .normalizedValue(normalizedValue)
                .normalizedUnit("kWh")
                .emissionFactor(ef)
                .emissionFactorSource(efSource)
                .co2eKg(co2eKg)
                .description(description)
                .category("Electricity")
                .scope("SCOPE_2")
                .periodStart(periodStart)
                .periodEnd(periodEnd)
                .build();
    }

    private String mapToJson(Map<String, String> map) {
        StringBuilder sb = new StringBuilder("{");
        map.forEach((k, v) -> sb
                .append("\"").append(k.replace("\"", "\\\"")).append("\"")
                .append(":")
                .append("\"").append(v.replace("\"", "\\\"")).append("\"")
                .append(","));
        if (sb.length() > 1) sb.deleteCharAt(sb.length() - 1);
        sb.append("}");
        return sb.toString();
    }
}

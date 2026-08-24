package com.example.BreatheESG.parser;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;
import org.springframework.stereotype.Component;
import java.io.InputStreamReader;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Component
public class SAPParser {

    // ── Unit conversions to litres ─────────────────────
    private static final Map<String, BigDecimal> UNIT_CONVERSIONS = Map.of(
            "L",   new BigDecimal("1.0"),
            "LTR", new BigDecimal("1.0"),
            "GAL", new BigDecimal("3.78541"),
            "M3",  new BigDecimal("1.0")     // kept as m3 for gas
    );

    private static final Map<String, String> UNIT_STANDARD = Map.of(
            "L",   "litre",
            "LTR", "litre",
            "GAL", "litre",
            "M3",  "m3"
    );

    // ── Material → category mapping ────────────────────
    private static final Map<String, String[]> MATERIAL_MAP = Map.of(
            "DIES001", new String[]{"Diesel",      "SCOPE_1"},
            "PETR001", new String[]{"Petrol",      "SCOPE_1"},
            "NGAS001", new String[]{"Natural Gas", "SCOPE_1"}
    );

    // ── Emission factors (DEFRA 2023) ──────────────────
    private static final Map<String, BigDecimal> EMISSION_FACTORS = Map.of(
            "Diesel",      new BigDecimal("2.68780"),
            "Petrol",      new BigDecimal("2.31490"),
            "Natural Gas", new BigDecimal("2.02400")
    );

    private static final Set<String> KNOWN_PLANTS = Set.of("1000", "2000", "3000");

    // ── Date format SAP uses: YYYYMMDD ─────────────────
    private static final DateTimeFormatter SAP_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    public List<ParseResult> parse(InputStream inputStream) {
        List<ParseResult> results = new ArrayList<>();

        try (CSVReader reader = new CSVReader(new InputStreamReader(inputStream))) {
            List<String[]> rows = reader.readAll();

            if (rows.isEmpty()) return results;

            // First row is header
            String[] headers = rows.get(0);

            // Process each data row
            for (int i = 1; i < rows.size(); i++) {
                String[] row = rows.get(i);
                results.add(parseRow(headers, row, i + 1));
            }

        } catch (Exception e) {
            results.add(ParseResult.builder()
                    .success(false)
                    .errorMessage("Could not read file: " + e.getMessage())
                    .build());
        }

        return results;
    }

    private ParseResult parseRow(String[] headers, String[] values, int rowNum) {
        // Build a map of header → value
        Map<String, String> row = new LinkedHashMap<>();
        for (int i = 0; i < headers.length && i < values.length; i++) {
            row.put(headers[i].trim(), values[i] != null ? values[i].trim() : "");
        }

        // Convert row to JSON string for raw storage
        String rawJson = mapToJson(row);

        // ── Parse quantity ─────────────────────────────
        String mengeRaw = row.getOrDefault("MENGE", "").trim();
        if (mengeRaw.isEmpty() || mengeRaw.equalsIgnoreCase("null")) {
            return ParseResult.builder()
                    .success(false)
                    .rawJson(rawJson)
                    .errorMessage("Missing quantity (MENGE)")
                    .build();
        }

        BigDecimal rawValue;
        try {
            rawValue = new BigDecimal(mengeRaw);
        } catch (NumberFormatException e) {
            return ParseResult.builder()
                    .success(false)
                    .rawJson(rawJson)
                    .errorMessage("Invalid quantity: " + mengeRaw)
                    .build();
        }

        // ── Parse date ────────────────────────────────
        String budatRaw = row.getOrDefault("BUDAT", "").trim();
        LocalDate activityDate;
        try {
            activityDate = LocalDate.parse(budatRaw, SAP_DATE);
        } catch (Exception e) {
            return ParseResult.builder()
                    .success(false)
                    .rawJson(rawJson)
                    .errorMessage("Invalid date: " + budatRaw)
                    .build();
        }

        // ── Parse unit ────────────────────────────────
        String rawUnit = row.getOrDefault("MEINS", "").trim().toUpperCase();
        BigDecimal conversion = UNIT_CONVERSIONS.get(rawUnit);
        if (conversion == null) {
            return ParseResult.builder()
                    .success(false)
                    .rawJson(rawJson)
                    .errorMessage("Unknown unit: " + rawUnit)
                    .build();
        }

        // ── Normalize value ───────────────────────────
        BigDecimal normalizedValue = rawValue.multiply(conversion).setScale(4, RoundingMode.HALF_UP);
        String normalizedUnit = UNIT_STANDARD.get(rawUnit);

        // ── Get material info ─────────────────────────
        String material = row.getOrDefault("MATNR", "").trim();
        String[] materialInfo = MATERIAL_MAP.get(material);
        String category = materialInfo != null ? materialInfo[0] : "Unknown";
        String scope    = materialInfo != null ? materialInfo[1] : "SCOPE_1";

        // ── Check suspicious ──────────────────────────
        String plantCode = row.getOrDefault("WERKS", "").trim();
        boolean flagged  = false;
        String flagReason = "";

        if (!KNOWN_PLANTS.contains(plantCode)) {
            flagged    = true;
            flagReason = "Unknown plant code: " + plantCode;
        }
        if (normalizedValue.compareTo(new BigDecimal("50000")) > 0) {
            flagged    = true;
            flagReason += (flagged ? " | " : "") + "Unusually high quantity: " + normalizedValue;
        }

        // ── Emission factor ───────────────────────────
        BigDecimal ef = EMISSION_FACTORS.getOrDefault(category, BigDecimal.ZERO);
        BigDecimal co2eKg = normalizedValue.multiply(ef).setScale(4, RoundingMode.HALF_UP);

        // ── Build plant description ───────────────────
        String description = category + " - Plant " + plantCode;

        return ParseResult.builder()
                .success(true)
                .suspicious(flagged)
                .flagReason(flagReason)
                .rawJson(rawJson)
                .rawValue(rawValue)
                .rawUnit(rawUnit)
                .normalizedValue(normalizedValue)
                .normalizedUnit(normalizedUnit)
                .emissionFactor(ef)
                .emissionFactorSource("DEFRA 2023")
                .co2eKg(co2eKg)
                .description(description)
                .category(category)
                .scope(scope)
                .activityDate(activityDate)
                .build();
    }

    // ── Simple map to JSON string ─────────────────────
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

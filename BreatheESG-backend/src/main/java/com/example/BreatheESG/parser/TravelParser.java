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
public class TravelParser {

    // ── Emission factors per km (DEFRA 2023) ──────────
    private static final Map<String, BigDecimal> FLIGHT_FACTORS = Map.of(
            "ECONOMY",  new BigDecimal("0.1553"),
            "BUSINESS", new BigDecimal("0.4286"),
            "FIRST",    new BigDecimal("0.6116")
    );
    private static final BigDecimal HOTEL_FACTOR   = new BigDecimal("31.0000");
    private static final BigDecimal GROUND_FACTOR  = new BigDecimal("0.1714");

    // ── Airport distance lookup (km) ──────────────────
    private static final Map<String, BigDecimal> AIRPORT_DISTANCES = new HashMap<>();
    static {
        AIRPORT_DISTANCES.put("BLR-LHR", new BigDecimal("8434"));
        AIRPORT_DISTANCES.put("BOM-JFK", new BigDecimal("12541"));
        AIRPORT_DISTANCES.put("DEL-DXB", new BigDecimal("2194"));
        AIRPORT_DISTANCES.put("BLR-SIN", new BigDecimal("3362"));
        AIRPORT_DISTANCES.put("DEL-LHR", new BigDecimal("6710"));
        AIRPORT_DISTANCES.put("BOM-LHR", new BigDecimal("7189"));
    }

    public List<ParseResult> parse(InputStream inputStream) {
        List<ParseResult> results = new ArrayList<>();

        try (CSVReader reader = new CSVReader(new InputStreamReader(inputStream))) {
            List<String[]> rows = reader.readAll();
            if (rows.isEmpty()) return results;

            String[] headers = rows.get(0);

            for (int i = 1; i < rows.size(); i++) {
                results.add(parseRow(headers, rows.get(i)));
            }

        } catch (Exception e) {
            results.add(ParseResult.builder()
                    .success(false)
                    .errorMessage("Could not read file: " + e.getMessage())
                    .build());
        }

        return results;
    }

    private ParseResult parseRow(String[] headers, String[] values) {
        Map<String, String> row = new LinkedHashMap<>();
        for (int i = 0; i < headers.length && i < values.length; i++) {
            row.put(headers[i].trim().toLowerCase(), values[i] != null ? values[i].trim() : "");
        }

        String rawJson    = mapToJson(row);
        String travelType = row.getOrDefault("travel_type", "").trim().toUpperCase();
        String travelClass = row.getOrDefault("travel_class", "ECONOMY").trim().toUpperCase();
        String origin     = row.getOrDefault("origin", "").trim().toUpperCase();
        String destination = row.getOrDefault("destination", "").trim().toUpperCase();

        // ── Parse date ────────────────────────────────
        LocalDate activityDate;
        try {
            activityDate = LocalDate.parse(row.getOrDefault("travel_date", "").trim());
        } catch (Exception e) {
            return ParseResult.builder()
                    .success(false)
                    .rawJson(rawJson)
                    .errorMessage("Invalid date: " + row.get("travel_date"))
                    .build();
        }

        // ── Determine distance ────────────────────────
        BigDecimal distance = null;
        boolean flagged     = false;
        String flagReason   = "";

        String distanceRaw = row.getOrDefault("distance_km", "").trim();
        if (!distanceRaw.isEmpty() && !distanceRaw.equalsIgnoreCase("null")) {
            try {
                distance = new BigDecimal(distanceRaw);
            } catch (NumberFormatException ignored) {}
        }

        if (distance == null && travelType.equals("FLIGHT")) {
            // Try airport code lookup
            String key     = origin + "-" + destination;
            String keyRev  = destination + "-" + origin;
            distance = AIRPORT_DISTANCES.containsKey(key)
                    ? AIRPORT_DISTANCES.get(key)
                    : AIRPORT_DISTANCES.get(keyRev);

            if (distance == null) {
                flagged    = true;
                flagReason = "Unknown airport codes: " + origin + " -> " + destination;
                distance   = BigDecimal.ZERO;
            }
        }

        if (distance == null && travelType.equals("HOTEL")) {
            distance = BigDecimal.ONE; // 1 night
        }

        if (distance == null) {
            distance = BigDecimal.ZERO;
        }

        // ── Get emission factor ───────────────────────
        BigDecimal ef;
        String efSource = "DEFRA 2023";
        String category;
        String unit;

        switch (travelType) {
            case "FLIGHT" -> {
                ef       = FLIGHT_FACTORS.getOrDefault(travelClass, FLIGHT_FACTORS.get("ECONOMY"));
                category = "Flight";
                unit     = "km";
            }
            case "HOTEL" -> {
                ef       = HOTEL_FACTOR;
                category = "Hotel";
                unit     = "night";
            }
            default -> {
                ef       = GROUND_FACTOR;
                category = "Ground Transport";
                unit     = "km";
            }
        }

        BigDecimal co2eKg = distance.multiply(ef).setScale(4, RoundingMode.HALF_UP);

        // ── Build description ─────────────────────────
        String description;
        if (travelType.equals("FLIGHT")) {
            description = "Flight (" + travelClass + ") - " + origin + " -> " + destination;
        } else if (travelType.equals("HOTEL")) {
            description = "Hotel (" + travelClass + ") - " + destination;
        } else {
            description = "Ground Transport - " + origin + " -> " + destination;
        }

        return ParseResult.builder()
                .success(true)
                .suspicious(flagged)
                .flagReason(flagReason)
                .rawJson(rawJson)
                .rawValue(distance)
                .rawUnit(unit)
                .normalizedValue(distance)
                .normalizedUnit(unit)
                .emissionFactor(ef)
                .emissionFactorSource(efSource)
                .co2eKg(co2eKg)
                .description(description)
                .category(category)
                .scope("SCOPE_3")
                .activityDate(activityDate)
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
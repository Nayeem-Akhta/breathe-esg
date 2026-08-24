package com.example.BreatheESG.service;

import com.example.BreatheESG.model.*;
import com.example.BreatheESG.parser.*;
import com.example.BreatheESG.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Service
@RequiredArgsConstructor
public class IngestionService {

    private final OrganizationRepository     organizationRepository;
    private final IngestionBatchRepository   batchRepository;
    private final RawSAPEntryRepository      rawSAPRepository;
    private final RawUtilityEntryRepository  rawUtilityRepository;
    private final RawTravelEntryRepository   rawTravelRepository;
    private final NormalizedEntryRepository  normalizedRepository;
    private final AuditLogRepository         auditLogRepository;
    private final SAPParser                  sapParser;
    private final UtilityParser              utilityParser;
    private final TravelParser               travelParser;

    @Transactional
    public Map<String, Object> ingestFile(
            MultipartFile file,
            String sourceType,
            UUID organizationId) throws IOException {

        // ── Find organization ──────────────────────────
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found: " + organizationId));

        // ── Create ingestion batch ─────────────────────
        IngestionBatch batch = IngestionBatch.builder()
                .organization(org)
                .sourceType(IngestionBatch.SourceType.valueOf(sourceType))
                .fileName(file.getOriginalFilename())
                .status(IngestionBatch.Status.PROCESSING)
                .build();
        batch = batchRepository.save(batch);

        // ── Parse based on source type ─────────────────
        List<ParseResult> results;
        try {
            results = switch (sourceType) {
                case "SAP_FUEL"            -> sapParser.parse(file.getInputStream());
                case "UTILITY_ELECTRICITY" -> utilityParser.parse(file.getInputStream());
                case "TRAVEL"              -> travelParser.parse(file.getInputStream());
                default -> throw new RuntimeException("Unknown source type: " + sourceType);
            };
        } catch (Exception e) {
            batch.setStatus(IngestionBatch.Status.FAILED);
            batch.setNotes("Parsing failed: " + e.getMessage());
            batchRepository.save(batch);
            throw e;
        }

        // ── Save results ───────────────────────────────
        int success    = 0;
        int failed     = 0;
        int suspicious = 0;

        for (int i = 0; i < results.size(); i++) {
            ParseResult result = results.get(i);
            int rowNumber      = i + 2; // +2 because row 1 is header

            if (!result.isSuccess()) {
                // Save failed raw entry
                saveRawEntry(sourceType, batch, org, rowNumber,
                        result.getRawJson(), "FAILED", result.getErrorMessage());
                failed++;
                continue;
            }

            // ── Save raw entry ─────────────────────────
            String parseStatus = result.isSuspicious() ? "SUSPICIOUS" : "SUCCESS";
            UUID rawId = saveRawEntry(sourceType, batch, org, rowNumber,
                    result.getRawJson(), parseStatus, null);

            if (result.isSuspicious()) suspicious++;

            // ── Save normalized entry ──────────────────
            NormalizedEntry entry = NormalizedEntry.builder()
                    .organization(org)
                    .batch(batch)
                    .sourceType(NormalizedEntry.SourceType.valueOf(sourceType))
                    .rawEntryId(rawId)
                    .description(result.getDescription())
                    .category(result.getCategory())
                    .scope(NormalizedEntry.Scope.valueOf(result.getScope()))
                    .activityDate(result.getActivityDate())
                    .periodStart(result.getPeriodStart())
                    .periodEnd(result.getPeriodEnd())
                    .rawValue(result.getRawValue())
                    .rawUnit(result.getRawUnit())
                    .normalizedValue(result.getNormalizedValue())
                    .normalizedUnit(result.getNormalizedUnit())
                    .emissionFactor(result.getEmissionFactor())
                    .emissionFactorSource(result.getEmissionFactorSource())
                    .co2eKg(result.getCo2eKg())
                    .reviewStatus(NormalizedEntry.ReviewStatus.PENDING)
                    .isFlaggedAuto(result.isSuspicious())
                    .flagReason(result.getFlagReason() != null ? result.getFlagReason() : "")
                    .build();

            entry = normalizedRepository.save(entry);

            // ── Write audit log ────────────────────────
            AuditLog log = AuditLog.builder()
                    .organization(org)
                    .entry(entry)
                    .action(AuditLog.Action.CREATED)
                    .afterValue("{\"source\":\"" + sourceType + "\",\"co2e_kg\":\""
                            + result.getCo2eKg() + "\"}")
                    .build();
            auditLogRepository.save(log);

            success++;
        }

        // ── Update batch summary ───────────────────────
        batch.setStatus(IngestionBatch.Status.COMPLETED);
        batch.setTotalRows(results.size());
        batch.setSuccessfulRows(success);
        batch.setFailedRows(failed);
        batchRepository.save(batch);

        // ── Return summary ─────────────────────────────
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("message",    "File processed successfully");
        summary.put("batch_id",   batch.getId().toString());
        summary.put("total",      results.size());
        summary.put("success",    success);
        summary.put("failed",     failed);
        summary.put("suspicious", suspicious);
        return summary;
    }

    // ── Helper: save correct raw entry type ───────────
    private UUID saveRawEntry(String sourceType, IngestionBatch batch,
                              Organization org, int rowNumber,
                              String rawJson, String status, String error) {
        return switch (sourceType) {
            case "SAP_FUEL" -> {
                RawSAPEntry raw = RawSAPEntry.builder()
                        .batch(batch)
                        .organization(org)
                        .rowNumber(rowNumber)
                        .rawData(rawJson != null ? rawJson : "{}")
                        .parseStatus(RawSAPEntry.ParseStatus.valueOf(status))
                        .parseError(error != null ? error : "")
                        .build();
                yield rawSAPRepository.save(raw).getId();
            }
            case "UTILITY_ELECTRICITY" -> {
                RawUtilityEntry raw = RawUtilityEntry.builder()
                        .batch(batch)
                        .organization(org)
                        .rowNumber(rowNumber)
                        .rawData(rawJson != null ? rawJson : "{}")
                        .parseStatus(RawUtilityEntry.ParseStatus.valueOf(status))
                        .parseError(error != null ? error : "")
                        .build();
                yield rawUtilityRepository.save(raw).getId();
            }
            default -> {
                RawTravelEntry raw = RawTravelEntry.builder()
                        .batch(batch)
                        .organization(org)
                        .rowNumber(rowNumber)
                        .rawData(rawJson != null ? rawJson : "{}")
                        .parseStatus(RawTravelEntry.ParseStatus.valueOf(status))
                        .parseError(error != null ? error : "")
                        .build();
                yield rawTravelRepository.save(raw).getId();
            }
        };
    }
}
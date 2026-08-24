package com.example.BreatheESG.service;

import com.example.BreatheESG.model.*;
import com.example.BreatheESG.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final NormalizedEntryRepository normalizedRepository;
    private final AuditLogRepository        auditLogRepository;
    private final OrganizationRepository    organizationRepository;
    private final IngestionBatchRepository  batchRepository;

    // ── List entries with optional filters ────────────
    public List<NormalizedEntry> getEntries(UUID orgId, String status,
                                            String source, String scope) {
        Organization org = getOrg(orgId);

        if (status != null && source != null) {
            return normalizedRepository
                    .findByOrganizationAndReviewStatusAndSourceTypeOrderByCreatedAtDesc(
                            org,
                            NormalizedEntry.ReviewStatus.valueOf(status),
                            NormalizedEntry.SourceType.valueOf(source)
                    );
        }
        if (status != null) {
            return normalizedRepository
                    .findByOrganizationAndReviewStatusOrderByCreatedAtDesc(
                            org, NormalizedEntry.ReviewStatus.valueOf(status));
        }
        if (source != null) {
            return normalizedRepository
                    .findByOrganizationAndSourceTypeOrderByCreatedAtDesc(
                            org, NormalizedEntry.SourceType.valueOf(source));
        }
        if (scope != null) {
            return normalizedRepository
                    .findByOrganizationAndScopeOrderByCreatedAtDesc(
                            org, NormalizedEntry.Scope.valueOf(scope));
        }

        return normalizedRepository.findByOrganizationOrderByCreatedAtDesc(org);
    }

    // ── Get single entry ──────────────────────────────
    public NormalizedEntry getEntry(UUID entryId) {
        return normalizedRepository.findById(entryId)
                .orElseThrow(() -> new RuntimeException("Entry not found: " + entryId));
    }

    // ── Get audit trail for entry ─────────────────────
    public List<AuditLog> getAuditTrail(UUID entryId) {
        NormalizedEntry entry = getEntry(entryId);
        return auditLogRepository.findByEntryOrderByTimestampAsc(entry);
    }

    // ── Approve ───────────────────────────────────────
    @Transactional
    public Map<String, Object> approve(UUID entryId, String note, String performedBy) {
        NormalizedEntry entry = getEntry(entryId);
        checkNotLocked(entry);

        String before = buildSnapshot(entry);

        entry.setReviewStatus(NormalizedEntry.ReviewStatus.APPROVED);
        entry.setReviewedBy(performedBy != null ? performedBy : "analyst");
        entry.setReviewedAt(LocalDateTime.now());
        entry.setReviewNote(note != null ? note : "");
        entry.setLocked(true);
        entry.setLockedAt(LocalDateTime.now());
        normalizedRepository.save(entry);

        writeLog(entry, AuditLog.Action.APPROVED, before,
                "{\"review_status\":\"APPROVED\",\"note\":\"" + (note != null ? note : "") + "\"}",
                performedBy);

        return Map.of(
                "message",  "Entry approved and locked",
                "entry_id", entryId.toString(),
                "locked",   true
        );
    }

    // ── Reject ────────────────────────────────────────
    @Transactional
    public Map<String, Object> reject(UUID entryId, String note, String performedBy) {
        NormalizedEntry entry = getEntry(entryId);
        checkNotLocked(entry);

        String before = buildSnapshot(entry);

        entry.setReviewStatus(NormalizedEntry.ReviewStatus.REJECTED);
        entry.setReviewedBy(performedBy != null ? performedBy : "analyst");
        entry.setReviewedAt(LocalDateTime.now());
        entry.setReviewNote(note != null ? note : "");
        normalizedRepository.save(entry);

        writeLog(entry, AuditLog.Action.REJECTED, before,
                "{\"review_status\":\"REJECTED\",\"note\":\"" + (note != null ? note : "") + "\"}",
                performedBy);

        return Map.of(
                "message",  "Entry rejected",
                "entry_id", entryId.toString()
        );
    }

    // ── Flag ──────────────────────────────────────────
    @Transactional
    public Map<String, Object> flag(UUID entryId, String note, String performedBy) {
        NormalizedEntry entry = getEntry(entryId);
        checkNotLocked(entry);

        String before = buildSnapshot(entry);

        entry.setReviewStatus(NormalizedEntry.ReviewStatus.FLAGGED);
        entry.setReviewedBy(performedBy != null ? performedBy : "analyst");
        entry.setReviewedAt(LocalDateTime.now());
        entry.setReviewNote(note != null ? note : "");
        normalizedRepository.save(entry);

        writeLog(entry, AuditLog.Action.FLAGGED, before,
                "{\"review_status\":\"FLAGGED\",\"note\":\"" + (note != null ? note : "") + "\"}",
                performedBy);

        return Map.of(
                "message",  "Entry flagged for clarification",
                "entry_id", entryId.toString()
        );
    }

    // ── Dashboard summary ─────────────────────────────
    public Map<String, Object> getDashboard(UUID orgId) {
        Organization org = getOrg(orgId);

        long pending    = normalizedRepository.countByOrganizationAndReviewStatus(org, NormalizedEntry.ReviewStatus.PENDING);
        long approved   = normalizedRepository.countByOrganizationAndReviewStatus(org, NormalizedEntry.ReviewStatus.APPROVED);
        long rejected   = normalizedRepository.countByOrganizationAndReviewStatus(org, NormalizedEntry.ReviewStatus.REJECTED);
        long flagged    = normalizedRepository.countByOrganizationAndReviewStatus(org, NormalizedEntry.ReviewStatus.FLAGGED);
        long suspicious = normalizedRepository.countByOrganizationAndIsFlaggedAutoTrue(org);

        BigDecimal scope1 = normalizedRepository.sumCo2eByOrganizationAndScope(org, NormalizedEntry.Scope.SCOPE_1);
        BigDecimal scope2 = normalizedRepository.sumCo2eByOrganizationAndScope(org, NormalizedEntry.Scope.SCOPE_2);
        BigDecimal scope3 = normalizedRepository.sumCo2eByOrganizationAndScope(org, NormalizedEntry.Scope.SCOPE_3);

        BigDecimal total  = scope1.add(scope2).add(scope3);

        List<IngestionBatch> recentBatches =
                batchRepository.findTop5ByOrganizationOrderByUploadedAtDesc(org);

        List<Map<String, Object>> batchList = new ArrayList<>();
        for (IngestionBatch b : recentBatches) {
            Map<String, Object> bMap = new LinkedHashMap<>();
            bMap.put("id",              b.getId().toString());
            bMap.put("source_type",     b.getSourceType().name());
            bMap.put("file_name",       b.getFileName());
            bMap.put("status",          b.getStatus().name());
            bMap.put("total_rows",      b.getTotalRows());
            bMap.put("successful_rows", b.getSuccessfulRows());
            bMap.put("failed_rows",     b.getFailedRows());
            bMap.put("uploaded_at",     b.getUploadedAt());
            batchList.add(bMap);
        }

        Map<String, Object> reviewSummary = new LinkedHashMap<>();
        reviewSummary.put("pending",    pending);
        reviewSummary.put("approved",   approved);
        reviewSummary.put("rejected",   rejected);
        reviewSummary.put("flagged",    flagged);
        reviewSummary.put("suspicious", suspicious);

        Map<String, Object> co2eByScope = new LinkedHashMap<>();
        co2eByScope.put("scope_1_kg", scope1.toPlainString());
        co2eByScope.put("scope_2_kg", scope2.toPlainString());
        co2eByScope.put("scope_3_kg", scope3.toPlainString());
        co2eByScope.put("total_kg",   total.toPlainString());

        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("review_summary",  reviewSummary);
        dashboard.put("co2e_by_scope",   co2eByScope);
        dashboard.put("recent_batches",  batchList);
        return dashboard;
    }

    // ── Helpers ───────────────────────────────────────
    private Organization getOrg(UUID orgId) {
        return organizationRepository.findById(orgId)
                .orElseThrow(() -> new RuntimeException("Organization not found: " + orgId));
    }

    private void checkNotLocked(NormalizedEntry entry) {
        if (entry.isLocked()) {
            throw new RuntimeException("Entry is locked and cannot be modified");
        }
    }

    private String buildSnapshot(NormalizedEntry entry) {
        return "{\"review_status\":\"" + entry.getReviewStatus().name() + "\"," +
                "\"is_locked\":" + entry.isLocked() + "}";
    }

    private void writeLog(NormalizedEntry entry, AuditLog.Action action,
                          String before, String after, String performedBy) {
        AuditLog log = AuditLog.builder()
                .organization(entry.getOrganization())
                .entry(entry)
                .action(action)
                .performedBy(performedBy != null ? performedBy : "analyst")
                .beforeValue(before)
                .afterValue(after)
                .build();
        auditLogRepository.save(log);
    }
}
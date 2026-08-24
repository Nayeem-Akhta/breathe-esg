package com.example.BreatheESG.controller;


import com.example.BreatheESG.model.AuditLog;
import com.example.BreatheESG.model.NormalizedEntry;
import com.example.BreatheESG.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/review")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // ── GET /api/review/dashboard/?organization_id=xxx ─
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(
            @RequestParam("organization_id") UUID orgId) {
        try {
            return ResponseEntity.ok(reviewService.getDashboard(orgId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ── GET /api/review/entries/?organization_id=xxx ───
    @GetMapping("/entries")
    public ResponseEntity<?> getEntries(
            @RequestParam("organization_id")        UUID orgId,
            @RequestParam(value = "status",  required = false) String status,
            @RequestParam(value = "source",  required = false) String source,
            @RequestParam(value = "scope",   required = false) String scope) {
        try {
            List<NormalizedEntry> entries =
                    reviewService.getEntries(orgId, status, source, scope);
            return ResponseEntity.ok(Map.of(
                    "count",   entries.size(),
                    "entries", entries.stream().map(this::toMap).toList()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ── GET /api/review/entries/{id} ──────────────────
    @GetMapping("/entries/{id}")
    public ResponseEntity<?> getEntry(@PathVariable UUID id) {
        try {
            NormalizedEntry entry   = reviewService.getEntry(id);
            List<AuditLog> logs     = reviewService.getAuditTrail(id);
            Map<String, Object> map = toMap(entry);
            map.put("audit_trail", logs.stream().map(this::logToMap).toList());
            return ResponseEntity.ok(map);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ── POST /api/review/entries/{id}/approve ─────────
    @PostMapping("/entries/{id}/approve")
    public ResponseEntity<?> approve(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String note        = body != null ? body.get("note") : null;
            String performedBy = body != null ? body.get("performed_by") : "analyst";
            return ResponseEntity.ok(reviewService.approve(id, note, performedBy));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ── POST /api/review/entries/{id}/reject ──────────
    @PostMapping("/entries/{id}/reject")
    public ResponseEntity<?> reject(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String note        = body != null ? body.get("note") : null;
            String performedBy = body != null ? body.get("performed_by") : "analyst";
            return ResponseEntity.ok(reviewService.reject(id, note, performedBy));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ── POST /api/review/entries/{id}/flag ────────────
    @PostMapping("/entries/{id}/flag")
    public ResponseEntity<?> flag(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String note        = body != null ? body.get("note") : null;
            String performedBy = body != null ? body.get("performed_by") : "analyst";
            return ResponseEntity.ok(reviewService.flag(id, note, performedBy));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ── Serialize NormalizedEntry to Map ──────────────
    private Map<String, Object> toMap(NormalizedEntry e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id",                     e.getId().toString());
        map.put("source_type",            e.getSourceType().name());
        map.put("category",               e.getCategory());
        map.put("description",            e.getDescription());
        map.put("scope",                  e.getScope().name());
        map.put("activity_date",          e.getActivityDate() != null ? e.getActivityDate().toString() : null);
        map.put("period_start",           e.getPeriodStart() != null ? e.getPeriodStart().toString() : null);
        map.put("period_end",             e.getPeriodEnd() != null ? e.getPeriodEnd().toString() : null);
        map.put("raw_value",              e.getRawValue() != null ? e.getRawValue().toPlainString() : "0");
        map.put("raw_unit",               e.getRawUnit());
        map.put("normalized_value",       e.getNormalizedValue() != null ? e.getNormalizedValue().toPlainString() : "0");
        map.put("normalized_unit",        e.getNormalizedUnit());
        map.put("emission_factor",        e.getEmissionFactor() != null ? e.getEmissionFactor().toPlainString() : "0");
        map.put("emission_factor_source", e.getEmissionFactorSource());
        map.put("co2e_kg",                e.getCo2eKg() != null ? e.getCo2eKg().toPlainString() : "0");
        map.put("review_status",          e.getReviewStatus().name());
        map.put("is_flagged_auto",        e.isFlaggedAuto());
        map.put("flag_reason",            e.getFlagReason());
        map.put("is_locked",              e.isLocked());
        map.put("is_edited",              e.isEdited());
        map.put("review_note",            e.getReviewNote());
        map.put("reviewed_by",            e.getReviewedBy());
        map.put("reviewed_at",            e.getReviewedAt() != null ? e.getReviewedAt().toString() : null);
        map.put("created_at",             e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        map.put("batch_id",               e.getBatch() != null ? e.getBatch().getId().toString() : null);
        return map;
    }

    // ── Serialize AuditLog to Map ─────────────────────
    private Map<String, Object> logToMap(AuditLog log) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("action",       log.getAction().name());
        map.put("timestamp",    log.getTimestamp() != null ? log.getTimestamp().toString() : null);
        map.put("user",         log.getPerformedBy() != null ? log.getPerformedBy() : "System");
        map.put("before_value", log.getBeforeValue());
        map.put("after_value",  log.getAfterValue());
        return map;
    }
}
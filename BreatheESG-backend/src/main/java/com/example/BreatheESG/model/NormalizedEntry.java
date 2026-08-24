package com.example.BreatheESG.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "normalized_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NormalizedEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private IngestionBatch batch;

    // Source tracking
    public enum SourceType {
        SAP_FUEL, UTILITY_ELECTRICITY, TRAVEL
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type")
    private SourceType sourceType;

    @Column(name = "raw_entry_id")
    private UUID rawEntryId;

    // When
    @Column(name = "activity_date")
    private LocalDate activityDate;

    @Column(name = "period_start")
    private LocalDate periodStart;

    @Column(name = "period_end")
    private LocalDate periodEnd;

    // What
    @Column(name = "description")
    private String description;

    @Column(name = "category")
    private String category;

    public enum Scope {
        SCOPE_1, SCOPE_2, SCOPE_3
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "scope")
    private Scope scope;

    // Measurement
    @Column(name = "raw_value", precision = 15, scale = 4)
    private BigDecimal rawValue;

    @Column(name = "raw_unit")
    private String rawUnit;

    @Column(name = "normalized_value", precision = 15, scale = 4)
    private BigDecimal normalizedValue;

    @Column(name = "normalized_unit")
    private String normalizedUnit;

    // Carbon
    @Column(name = "emission_factor", precision = 15, scale = 6)
    private BigDecimal emissionFactor;

    @Column(name = "emission_factor_source")
    private String emissionFactorSource;

    @Column(name = "co2e_kg", precision = 15, scale = 4)
    private BigDecimal co2eKg;

    // Review
    public enum ReviewStatus {
        PENDING, APPROVED, REJECTED, FLAGGED
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "review_status")
    @Builder.Default
    private ReviewStatus reviewStatus = ReviewStatus.PENDING;

    @Column(name = "reviewed_by")
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "review_note", columnDefinition = "TEXT")
    private String reviewNote;

    // Edits
    @Column(name = "is_edited")
    @Builder.Default
    private boolean isEdited = false;

    @Column(name = "original_value", precision = 15, scale = 4)
    private BigDecimal originalValue;

    @Column(name = "edited_by")
    private String editedBy;

    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    @Column(name = "edit_reason", columnDefinition = "TEXT")
    private String editReason;

    // Suspicious flag
    @Column(name = "is_flagged_auto")
    @Builder.Default
    private boolean isFlaggedAuto = false;

    @Column(name = "flag_reason")
    private String flagReason;

    // Audit lock
    @Column(name = "is_locked")
    @Builder.Default
    private boolean isLocked = false;

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

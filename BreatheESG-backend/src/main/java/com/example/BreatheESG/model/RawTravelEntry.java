package com.example.BreatheESG.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "raw_travel_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RawTravelEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private IngestionBatch batch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(name = "row_number")
    private int rowNumber;

    @Column(name = "raw_data", columnDefinition = "TEXT")
    private String rawData;

    public enum ParseStatus {
        SUCCESS, FAILED, SUSPICIOUS
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "parse_status")
    private ParseStatus parseStatus;

    @Column(name = "parse_error", columnDefinition = "TEXT")
    private String parseError;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
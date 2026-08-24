package com.example.BreatheESG.repository;

import com.example.BreatheESG.model.NormalizedEntry;
import com.example.BreatheESG.model.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface NormalizedEntryRepository extends JpaRepository<NormalizedEntry, UUID> {

    // Get all entries for org
    List<NormalizedEntry> findByOrganizationOrderByCreatedAtDesc(Organization organization);

    // Filter by review status
    List<NormalizedEntry> findByOrganizationAndReviewStatusOrderByCreatedAtDesc(
            Organization organization,
            NormalizedEntry.ReviewStatus reviewStatus
    );

    // Filter by source type
    List<NormalizedEntry> findByOrganizationAndSourceTypeOrderByCreatedAtDesc(
            Organization organization,
            NormalizedEntry.SourceType sourceType
    );

    // Filter by scope
    List<NormalizedEntry> findByOrganizationAndScopeOrderByCreatedAtDesc(
            Organization organization,
            NormalizedEntry.Scope scope
    );

    // Filter by status AND source
    List<NormalizedEntry> findByOrganizationAndReviewStatusAndSourceTypeOrderByCreatedAtDesc(
            Organization organization,
            NormalizedEntry.ReviewStatus reviewStatus,
            NormalizedEntry.SourceType sourceType
    );

    // Count by review status
    long countByOrganizationAndReviewStatus(
            Organization organization,
            NormalizedEntry.ReviewStatus reviewStatus
    );

    // Count suspicious
    long countByOrganizationAndIsFlaggedAutoTrue(Organization organization);

    // Sum CO2e by scope for approved entries
    @Query("SELECT COALESCE(SUM(e.co2eKg), 0) FROM NormalizedEntry e " +
            "WHERE e.organization = :org " +
            "AND e.scope = :scope " +
            "AND e.reviewStatus = 'APPROVED'")
    BigDecimal sumCo2eByOrganizationAndScope(
            @Param("org") Organization organization,
            @Param("scope") NormalizedEntry.Scope scope
    );
}

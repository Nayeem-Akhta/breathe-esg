package com.example.BreatheESG.repository;

import com.example.BreatheESG.model.IngestionBatch;
import com.example.BreatheESG.model.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface IngestionBatchRepository extends JpaRepository<IngestionBatch, UUID> {

    // Get recent batches for an organization
    List<IngestionBatch> findTop5ByOrganizationOrderByUploadedAtDesc(Organization organization);

    // Get all batches for an organization
    List<IngestionBatch> findByOrganizationOrderByUploadedAtDesc(Organization organization);
}
package com.example.BreatheESG.repository;

import com.example.BreatheESG.model.RawTravelEntry;
import com.example.BreatheESG.model.IngestionBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface RawTravelEntryRepository extends JpaRepository<RawTravelEntry, UUID> {
    List<RawTravelEntry> findByBatch(IngestionBatch batch);
}

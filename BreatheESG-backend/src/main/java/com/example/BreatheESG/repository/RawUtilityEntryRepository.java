package com.example.BreatheESG.repository;

import com.example.BreatheESG.model.RawUtilityEntry;
import com.example.BreatheESG.model.IngestionBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface RawUtilityEntryRepository extends JpaRepository<RawUtilityEntry, UUID> {
    List<RawUtilityEntry> findByBatch(IngestionBatch batch);
}

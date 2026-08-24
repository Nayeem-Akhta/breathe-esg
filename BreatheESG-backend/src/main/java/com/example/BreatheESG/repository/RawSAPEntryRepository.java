package com.example.BreatheESG.repository;

import com.example.BreatheESG.model.RawSAPEntry;
import com.example.BreatheESG.model.IngestionBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface RawSAPEntryRepository extends JpaRepository<RawSAPEntry, UUID> {
    List<RawSAPEntry> findByBatch(IngestionBatch batch);
}

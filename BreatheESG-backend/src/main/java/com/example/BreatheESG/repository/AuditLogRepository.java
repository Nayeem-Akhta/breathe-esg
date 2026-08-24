package com.example.BreatheESG.repository;

import com.example.BreatheESG.model.AuditLog;
import com.example.BreatheESG.model.NormalizedEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    // Get full audit trail for one entry
    List<AuditLog> findByEntryOrderByTimestampAsc(NormalizedEntry entry);
}

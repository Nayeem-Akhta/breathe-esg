package com.example.BreatheESG.controller;


import com.example.BreatheESG.service.IngestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ingest")
@RequiredArgsConstructor
public class IngestionController {

    private final IngestionService ingestionService;

    /**
     * POST /api/ingest/upload
     * Params: file (multipart), source_type, organization_id
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file")            MultipartFile file,
            @RequestParam("source_type")     String sourceType,
            @RequestParam("organization_id") UUID organizationId) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "No file provided"));
        }

        try {
            Map<String, Object> result =
                    ingestionService.ingestFile(file, sourceType, organizationId);
            return ResponseEntity.status(201).body(result);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Parsing failed: " + e.getMessage()));
        }
    }
}
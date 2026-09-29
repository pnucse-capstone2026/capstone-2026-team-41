package com.scanops.scan;

import java.util.List;

public record PrScanResponse(
        String repo,
        int prNumber,
        int totalFiles,
        int vulnerableCount,
        List<PrScanFinding> findings,
        double elapsed
) {}

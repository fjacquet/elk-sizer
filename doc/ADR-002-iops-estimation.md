# ADR-002: IOPS Estimation Engine

## Status
Accepted

## Context

The `PerformanceSlice` store captured three user inputs — `searchRate`, `indexingRate`, and `concurrentSearches` — but no engine consumed them. The existing four engines (storage, cluster, hardware, sustainability) only validated cluster sizing by capacity and memory. Dell PowerStore models already had `maxIOPS` and `latencyMs` specifications in the JSON data and TypeScript types, but the hardware engine selected models purely by capacity.

A cluster that is correctly sized for storage can still be SAN-saturated at peak ingest, causing indexing backlogs and search latency spikes. Without IOPS estimation, engineers had no signal that the selected PowerStore model would be a bottleneck.

## Decision

Add a fifth calculation engine (`performance`) that follows the identical Strategy Pattern used by the existing four engines:

- Pure function with no React dependencies
- Located in `src/engines/performance/`
- Consumed by a dedicated hook `usePerformanceCalc`
- Wired into `useCalculations()` pipeline
- Results exposed through `CalculationResults.performance`

The engine activates the existing `searchRate` and `indexingRate` store fields. Only hot and warm tiers are analysed for SAN IOPS, matching the hardware engine's storage allocation (cold and frozen tiers use object storage — PowerScale or ECS — which has a different I/O model).

### IOPS model

**Hot tier** (write + read):
- Write IOPS: `(indexingRate × 1 KB / 1024) × 1024/4 × 4` (4 KB random writes, ×4 Lucene write amplification)
- Read IOPS: `searchRate × 0.75 × (shards/nodes) × 20`

**Warm tier** (read only):
- Read IOPS: `searchRate × 0.20 × (shards/nodes) × 20`

**Cold/Frozen** (object storage — excluded from SAN IOPS):
- No SAN IOPS computed

**Available IOPS**: sum of `PowerStore.maxIOPS × count` across all `bom.sanStorage` entries.

**Utilisation**: `(totalRequired × 1.30) / totalAvailable` (30% headroom buffer).

### PowerStore selection remains capacity-first

IOPS is a validation layer, not a selection driver. The hardware engine still selects the PowerStore model by capacity. The performance engine validates whether the selected model is IOPS-adequate and the Architecture Advisor warns the user if it is not.

## Options Considered

**A. Extend the hardware engine** — rejected. The hardware engine's responsibility is BOM generation. Adding IOPS formulas would mix selection logic with performance analytics, making the engine harder to test independently.

**B. Extend the cluster engine** — rejected. The cluster engine has no knowledge of hardware IOPS specifications; it only knows about memory and storage ratios.

**C. New standalone engine (chosen)** — consistent with the existing Strategy Pattern. Each engine is a pure function with a well-defined input/output contract. Adding a fifth engine preserves this architectural clarity and allows independent testing.

## Consequences

- `PerformanceSlice` fields (`searchRate`, `indexingRate`) are now load-bearing inputs
- `concurrentSearches` is captured but not yet used (available for future query latency modelling)
- Frozen and cold tier IOPS are out of scope (different storage backend, different I/O model)
- PowerStore selection could be upgraded in the future to validate IOPS during model selection (not just post-selection warning)
- All existing tests remain valid; 12 new unit tests added for the IOPS calculator

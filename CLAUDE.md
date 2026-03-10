# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Browser-based Elasticsearch cluster sizing tool for on-premise Dell infrastructure. Helps engineers size Elastic clusters using Dell PowerEdge servers, PowerStore FC (SAN), and PowerScale/ECS (S3). Purely client-side — no backend.

## Commands

```bash
npm run dev           # Start dev server at http://localhost:5173/elk-sizer/
npm run build         # Type check (tsc -b) + Vite production build
npm run typecheck     # TypeScript check only (tsc --noEmit)
npm run lint          # Biome check (format + lint)
npm run lint:fix      # Biome auto-fix (--write)
npm run test          # Run Vitest (watch mode)
npm run test:coverage # Coverage report (75% threshold on engines + utils)
```

Run a single test file: `npx vitest run src/engines/performance/iopsCalculator.test.ts`

## Architecture

### Engine Pipeline (Pure Functions)

Five independent calculation engines compose via React hooks in a strict pipeline:

```
Store → useStorageCalc → useClusterCalc → useHardwareCalc → useSustainabilityCalc
                                                          → usePerformanceCalc
```

Orchestrated in `src/hooks/useCalculations.ts`. Each engine is a pure function (no React imports):

| Engine | File | Input | Output |
|--------|------|-------|--------|
| Storage | `src/engines/storage/` | Ingest + retention config | Per-tier GB (raw, effective, buffered) |
| Cluster | `src/engines/cluster/` | StorageResult | Nodes, shards, JVM heap per tier |
| Hardware | `src/engines/hardware/` | ClusterResult + deployment config | Dell server/storage BOM |
| Sustainability | `src/engines/sustainability/` | HardwareResult | Power, CO2, TCO |
| Performance | `src/engines/performance/` | ClusterResult + HardwareResult | IOPS, latency, FC utilization |

### Zustand Store (5 Slices)

State lives in `src/store/configStore.ts`, composed from 5 slices in `src/store/slices/`. State persists to URL hash via LZ-String compression (`src/store/urlStorage.ts`), enabling shareable URLs.

- **IngestSlice** — dailyIngestGB, compressionCodec, replicaCount, indexCount
- **RetentionSlice** — hotDays, warmDays, coldDays, frozenDays, ilmEnabled
- **PerformanceSlice** — searchRate, indexingRate, concurrentSearches, concurrentUsers, dashboardCount, logSourceCount, workloadProfile
- **DeploymentSlice** — deploymentType, serverModel, cpuOption, memoryPerNode, storageModel, frozenBackend, networkSpeed
- **AdvancedSlice** — pue, carbonRegion, jvmHeapOverride, shardsPerIndex, unitSystem, electricityCostPerKwh, projectYears

Store version is currently **2**. Bump version when changing persisted field names/shapes.

### Deployment Types

`DeploymentType: 'baremetal' | 'vm' | 'ece'` — affects node count and storage via overhead factors:

| Type | Perf Factor | Storage Factor |
|------|-------------|----------------|
| baremetal | 1.0 | 1.0 |
| vm | 0.78 | 0.86 |
| ece | 0.72 | 0.82 |

### Data Layer

Dell hardware specs in `src/data/` as JSON: `dell-servers.json`, `dell-powerstore.json`, `dell-powerscale.json`, `elastic-node-roles.json`. Imported directly by engines.

### i18n

react-i18next with 10 namespaces (common, ingest, retention, performance, deployment, advanced, output, pdf, guide, advisor) x 4 languages (EN, FR, DE, IT). All UI strings must use translation keys. Swiss locale variants for number formatting (en-CH, fr-CH, de-CH, it-CH).

## Code Conventions

- **Formatter**: Biome — single quotes, no semicolons, 2-space indent, 100-char line width
- **Imports**: Biome auto-organizes imports; `noUnusedImports: error`, `noUnusedVariables: error`
- **TypeScript**: Strict mode with `noUncheckedIndexedAccess`, `noImplicitAny`, `strictNullChecks`
- **Path aliases**: `@/`, `@engines/`, `@components/`, `@store/`, `@types/`, `@utils/`, `@data/`, `@hooks/`
- **Testing**: Vitest with jsdom, globals enabled. 75% coverage threshold on `src/engines/**` and `src/utils/**` only. Tests co-located with source or in `tests/`.
- **Engines must be pure functions** — no React imports, no side effects, independently testable
- **Infrastructure nodes** (master/ingest/coord) always use R660 regardless of user server selection

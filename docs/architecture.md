# Architecture

Technical overview of the ELK Sizer codebase for contributors and maintainers.

---

## Directory Structure

```
elk-sizer/
├── src/
│   ├── components/
│   │   ├── advisor/        # Architecture Advisor view
│   │   ├── common/         # Shared primitives: Card, Select, Slider, Toggle, Tooltip
│   │   ├── guide/          # Sizing guide (GuideView + 6 section components)
│   │   ├── inputs/         # Five configuration panels
│   │   ├── layout/         # Cockpit, Header, InputSidebar, OutputDashboard
│   │   └── outputs/        # Report components: BOM, Sankey, sustainability…
│   ├── data/
│   │   ├── dell-servers.json       # PowerEdge catalog (CPU options, memory, drives)
│   │   ├── dell-powerstore.json    # PowerStore SAN models
│   │   ├── dell-powerscale.json    # PowerScale NAS models
│   │   └── elastic-node-roles.json # Elasticsearch node role reference
│   ├── engines/
│   │   ├── storage/        # Tier storage calculation
│   │   ├── cluster/        # Node/shard/JVM sizing
│   │   ├── hardware/       # Dell BOM generation
│   │   └── sustainability/ # Power, CO2, TCO
│   ├── hooks/
│   │   ├── useCalculations.ts        # Orchestrates all four engines
│   │   ├── useArchitectureAdvice.ts  # Real-time architecture recommendations
│   │   ├── useClusterCalc.ts
│   │   ├── useHardwareCalc.ts
│   │   ├── useStorageCalc.ts
│   │   └── useSustainabilityCalc.ts
│   ├── i18n/
│   │   ├── config.ts
│   │   └── locales/
│   │       ├── en/   # English (canonical — add keys here first)
│   │       ├── fr/   # French
│   │       ├── de/   # German
│   │       └── it/   # Italian
│   ├── store/
│   │   ├── configStore.ts      # Zustand store (combines all slices)
│   │   ├── urlStorage.ts       # LZ-String hash persistence adapter
│   │   └── slices/
│   │       ├── ingestSlice.ts
│   │       ├── retentionSlice.ts
│   │       ├── performanceSlice.ts
│   │       ├── deploymentSlice.ts  # serverModel, cpuOption, memoryPerNode…
│   │       └── advancedSlice.ts
│   └── types/
│       ├── sizing.ts    # ElasticTier, SIZING constants, TierSizing, NodeSizing…
│       ├── results.ts   # StorageResult, ClusterResult, HardwareResult…
│       └── hardware.ts  # DellServer, ServerConfig, HardwareBOM…
├── docs/                # Project documentation (you are here)
└── public/              # Static assets
```

---

## Data Flow

```
User inputs (Zustand store)
        │
        ▼
useStorageCalc          →  StorageResult  (per-tier watermark-buffered GB)
        │
        ▼
useClusterCalc          →  ClusterResult  (node counts, JVM heap, shards)
        │
        ▼
useHardwareCalc         →  HardwareResult (BOM, rack units, cost estimate)
        │
        ▼
useSustainabilityCalc   →  SustainabilityResult (power, CO2, TCO)
        │
        ▼
useCalculations         →  CalculationResults (all four results combined)
        │
        ▼
useArchitectureAdvice   →  ArchitectureAdvice (pattern, warnings, optimizations)
```

All hooks use `useMemo` with precise dependency arrays. Re-calculation only happens when relevant inputs change.

---

## State Management

State is managed by **Zustand** with a single `useConfigStore` hook composed of five slices:

| Slice | Key fields |
|---|---|
| `IngestSlice` | `dailyIngestGB`, `compressionCodec`, `replicaCount`, `indexCount` |
| `RetentionSlice` | `hotDays`, `warmDays`, `coldDays`, `frozenDays`, `ilmEnabled` |
| `PerformanceSlice` | `searchRate`, `indexingRate`, `concurrentSearches` |
| `DeploymentSlice` | `deploymentType`, `serverModel`, `cpuOption`, `memoryPerNode`, `storageModel`, `frozenBackend`, `networkSpeed` |
| `AdvancedSlice` | `pue`, `carbonRegion`, `jvmHeapOverride`, `shardsPerIndex`, `unitSystem`, `electricityCostPerKwh`, `projectYears` |

### URL Persistence

The store uses a custom `urlHashStorage` adapter (LZ-String) so all state round-trips through `window.location.hash`. This means:

- Sharing the URL shares the complete configuration
- `#guide`, `#advisor` etc. in the hash also control navigation — the `Cockpit` reads the hash on mount and on `hashchange` events to set the active view

The store's `partialize` option controls exactly which fields are persisted (excludes derived/computed state).

---

## Calculation Engines

Each engine is a **pure function** — no side effects, no React dependencies. This makes them independently testable.

### Storage Engine (`engines/storage/`)

Input: `IngestSlice` + `RetentionSlice` state
Output: `StorageResult` — per-tier `watermarkBufferedGB`

Key file: `engines/storage/index.ts`

### Cluster Engine (`engines/cluster/`)

Input: `StorageResult` + `memoryPerNode` + `jvmHeapOverride`
Output: `ClusterResult` — node counts, JVM heap, shard counts per tier + infrastructure roles

Key files:
- `engines/cluster/index.ts` — orchestration, infrastructure node counts
- `engines/cluster/helpers/nodeCalculator.ts` — per-tier data node sizing formula

### Hardware Engine (`engines/hardware/`)

Input: `ClusterResult` + `deploymentType` + `frozenBackend` + `serverModel` + `cpuOption`
Output: `HardwareResult` — `HardwareBOM`, rack units, cost estimate

Key files:
- `engines/hardware/index.ts` — BOM assembly
- `engines/hardware/helpers/serverSelector.ts` — server + CPU selection logic
- `engines/hardware/strategies/powerstoreStrategy.ts` — PowerStore unit count
- `engines/hardware/strategies/powerscaleStrategy.ts` — PowerScale node count

### Sustainability Engine (`engines/sustainability/`)

Input: `HardwareResult` + `AdvancedSlice` state
Output: `SustainabilityResult` — power, CO2, TCO

---

## Component Architecture

### Common Primitives

All accept an optional `tooltip?: string` prop that renders an inline ⓘ icon with hover text:

- `Slider` — labeled range input
- `Select` — labeled dropdown
- `Toggle` — labeled checkbox/switch
- `Tooltip` — wraps any content with a hover tooltip

### Input Panels

Each panel (`IngestPanel`, `RetentionPanel`, `PerformancePanel`, `DeploymentPanel`, `AdvancedPanel`) reads from `useConfigStore` directly. No prop drilling.

### Output Components

All receive `results: CalculationResults` as a prop from `OutputDashboard`, which calls `useCalculations()` once and distributes results.

### Cockpit (Layout Shell)

`Cockpit` manages the active view state (`config | report | guide | advisor`) and syncs it bidirectionally with `window.location.hash`. Renders one view at a time; the input sidebar is always visible on desktop.

---

## i18n

Eight translation namespaces: `common`, `ingest`, `retention`, `performance`, `deployment`, `advanced`, `output`, `guide`.

Tooltip keys follow a `{key}_tooltip` convention — e.g., `dailyIngest_tooltip` in `ingest.json`.

To add a new field:
1. Add the key to `en/*.json`
2. Add matching keys to `fr/*.json`, `de/*.json`, `it/*.json`
3. The i18n config has `fallbackLng: 'en'` — untranslated keys fall back to English

---

## Adding a New Dell Server Model

1. Add the model object to `src/data/dell-servers.json` following the existing schema:
   - `id`, `model`, `generation`, `cpuOptions[]`, `maxMemoryGB`, `memorySlots`, `maxDrives`, `recommendedTier[]`, `powerSupplyWatts`, `idlePowerWatts`, `maxPowerWatts`, `rackUnits`
2. Add the option to the `serverModel` Select in `DeploymentPanel.tsx`
3. Update the BOM rack unit calculation in `engines/hardware/index.ts` if the server is not 2U

---

## Testing

Tests live alongside source files or in `src/__tests__/`. The coverage threshold is **75%** for `engines/` and `utils/`.

```bash
npm run test              # Watch mode
npm run test:coverage     # Coverage report in coverage/
```

Engines are the primary test target — they are pure functions and fully unit-testable without React.

Property-based tests use `fast-check` for boundary and invariant testing of sizing formulas.

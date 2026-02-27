# ELK Sizer - Elasticsearch Cluster Sizing Tool

## Project Overview
Browser-based Elasticsearch cluster sizing tool for on-premise Dell infrastructure. Helps engineers size Elastic clusters using Dell PowerEdge servers, PowerStore FC (SAN), and PowerScale/ECS (S3).

## Tech Stack
- **Framework**: React 19 + TypeScript 5.x (strict mode)
- **State**: Zustand 5.x with LZ-String URL persistence
- **Styling**: Tailwind CSS 4.x (dark mode default)
- **Build**: Vite 7.x
- **Testing**: Vitest + Testing Library + fast-check
- **Linting**: Biome (formatter + linter)
- **Visualization**: D3-Sankey, Recharts
- **Export**: jsPDF + jspdf-autotable, js-yaml
- **i18n**: react-i18next (EN, FR, DE, IT)

## Architecture

### Four Calculation Engines (Strategy Pattern)
- `src/engines/storage/` — Per-tier capacity calculation
- `src/engines/cluster/` — Node count, shard, JVM sizing
- `src/engines/hardware/` — Dell model selection, BOM generation
- `src/engines/sustainability/` — Power, CO2, TCO

### Five Zustand Slices
- `IngestSlice` — dailyIngestGB, compressionCodec, replicaCount, indexCount
- `RetentionSlice` — hotDays, warmDays, coldDays, frozenDays, ilmEnabled
- `PerformanceSlice` — searchRate, indexingRate, concurrentSearches
- `DeploymentSlice` — deploymentType, serverModel, storageModel, frozenBackend, networkSpeed
- `AdvancedSlice` — pue, carbonRegion, jvmHeapOverride, shardsPerIndex, unitSystem

### Key Constants
- JVM Heap Max: 31 GB (compressed OOPs threshold)
- JVM Heap Ratio: 50% of RAM
- VM Performance Factor: 0.78
- VM Storage Factor: 0.86
- Watermark Buffer: 1.25 (25% headroom)
- Memory:Storage ratios: hot 1:30, warm 1:160, cold 1:500, frozen 1:1600

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Type check + build
npm run typecheck    # TypeScript check only
npm run lint         # Biome check
npm run lint:fix     # Biome auto-fix
npm run test         # Run tests
npm run test:coverage # Tests with coverage
```

## Code Conventions
- Single quotes, no semicolons (Biome config)
- Path aliases: @/, @engines/, @components/, @store/, @types/, @utils/, @data/, @hooks/
- 75% coverage threshold on engines and utils
- All UI strings via react-i18next (8 namespaces, 4 languages)
- Swiss locale variants for number formatting (en-CH, fr-CH, de-CH, it-CH)

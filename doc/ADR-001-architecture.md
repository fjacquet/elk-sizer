# ADR-001: Architecture Decision Record

## Status
Accepted

## Context
We need a browser-based Elasticsearch cluster sizing tool for on-premise Dell infrastructure. The tool must handle complex sizing calculations across multiple data tiers (hot/warm/cold/frozen), Dell hardware selection, and VM vs bare metal comparison.

## Decision

### Technology Stack
We chose the same stack as the raidy project for consistency:
- **React 19 + TypeScript strict** for type-safe UI
- **Zustand** for state management with URL persistence via LZ-String
- **Tailwind CSS 4** for styling (dark mode default)
- **Vite 7** for fast dev/build

### Architecture Pattern: Strategy + Engine
We use four independent calculation engines following the strategy pattern:
1. **Storage Engine** — Per-tier capacity: `daily * days * compression * replicas * watermark`
2. **Cluster Engine** — Node sizing based on memory:storage ratios per tier
3. **Hardware Engine** — Dell model selection using strategies (PowerStore, PowerScale, ECS)
4. **Sustainability Engine** — Power, CO2, TCO calculation

Engines are pure functions. React hooks orchestrate them with memoization.

### State Shape
Five Zustand slices (Ingest, Retention, Performance, Deployment, Advanced) provide a clean separation of concerns. All state is serialized to URL hash via LZ-String for sharing.

### Dell Hardware Data
Static JSON files represent Dell server models (R760, R660, R7725), PowerStore arrays (500T-9200T), and PowerScale nodes. This avoids API dependencies while enabling easy updates.

### i18n
Four Swiss languages (EN, FR, DE, IT) with 8 namespaces per language. Translations bundled at build time.

## Consequences
- Pure engine functions are easily testable (75% coverage threshold)
- URL sharing works without backend
- Static data means manual updates for new Dell models
- Client-side only — no server costs, works offline after load

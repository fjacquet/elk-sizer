# Contributing

## Prerequisites

- Node.js 22+
- npm 10+

## Setup

```bash
git clone https://github.com/fjacquet/elk-sizer.git
cd elk-sizer
npm install
npm run dev
```

The dev server runs at `http://localhost:5173/elk-sizer/`.

---

## Code Conventions

### Formatting and Linting

This project uses **Biome** for both formatting and linting — no Prettier or ESLint.

```bash
npm run lint        # Check only
npm run lint:fix    # Auto-fix
```

Key style rules:
- **Single quotes**, no semicolons
- 2-space indentation
- Trailing commas in multi-line objects/arrays

### TypeScript

Strict mode is enabled. No `any`, no `as unknown as X` without a comment explaining why.

Path aliases are configured in `vite.config.ts` and `tsconfig.json`:

```ts
@/          → src/
@engines/   → src/engines/
@components/ → src/components/
@store/     → src/store/
@types/     → src/types/
@utils/     → src/utils/
@data/      → src/data/
@hooks/     → src/hooks/
```

---

## Project Structure

See [architecture.md](architecture.md) for the full directory tree and data flow.

---

## Adding a New Feature

### New Input Field

1. Add the field to the relevant slice in `src/store/slices/`
2. Add it to `getDefaultState()` and `partialize` in `src/store/configStore.ts`
3. Add the translation key to all four locale files (`en`, `fr`, `de`, `it`) in `src/i18n/locales/`
4. Add a `{key}_tooltip` translation key in all locales
5. Wire it into the relevant panel component in `src/components/inputs/`
6. Pass it to the affected calculation hook if it changes sizing results

### New Calculation Engine

Pure functions only — no React hooks, no side effects:

```ts
// src/engines/myengine/index.ts
export interface MyEngineInput { ... }
export function calculateMyEngine(input: MyEngineInput): MyResult { ... }
```

Create a matching hook in `src/hooks/useMyCalc.ts` that reads from the store and calls the engine.

### New Output Component

Add the component to `src/components/outputs/`, export it from `src/components/outputs/index.ts`, and add it to `OutputDashboard.tsx`.

### New Dell Server Model

1. Add the model to `src/data/dell-servers.json` following the schema:

```json
{
  "id": "r760xs",
  "model": "PowerEdge R760XS",
  "generation": "16G",
  "cpuOptions": [
    { "model": "...", "cores": 32, "threads": 64, "baseClockGHz": 2.1, "tdpWatts": 270 }
  ],
  "maxMemoryGB": 2048,
  "memorySlots": 32,
  "maxDrives": 24,
  "driveFormFactor": "2.5in",
  "pcieSlots": 8,
  "networkPorts": [{ "speed": "25GbE", "count": 2, "type": "SFP28" }],
  "powerSupplyWatts": 1400,
  "idlePowerWatts": 350,
  "maxPowerWatts": 1200,
  "rackUnits": 2,
  "recommendedTier": ["hot", "warm"]
}
```

2. Add the option to `DeploymentPanel.tsx`'s server model Select

---

## Testing

Tests are colocated with source or in `src/__tests__/`. Run with:

```bash
npm run test              # Watch mode
npm run test:coverage     # Coverage report
```

Coverage thresholds (enforced in CI): **75%** for `src/engines/` and `src/utils/`.

### What to Test

- **Engines** — unit-test every formula. Engines are pure functions; no mocking needed.
- **Hooks** — test via `renderHook` from `@testing-library/react` with a wrapping store provider.
- **Property tests** — use `fast-check` for boundary conditions (e.g., `dailyIngestGB = 0`, `hotDays = 1`).

### Example Engine Test

```ts
import { describe, it, expect } from 'vitest'
import { calculateCluster } from '@engines/cluster'

describe('calculateCluster', () => {
  it('respects JVM heap cap at 31 GB', () => {
    const result = calculateCluster({
      storageResult: mockStorageResult({ hotGB: 1000 }),
      serverMemoryGB: 512,
      jvmHeapOverride: null,
    })
    for (const tier of result.tiers) {
      expect(tier.jvmHeapGB).toBeLessThanOrEqual(31)
    }
  })
})
```

---

## Translations

Add English first — other languages fall back to English if a key is missing.

Namespaces and their source files:

| Namespace | File | Used by |
|---|---|---|
| `common` | `common.json` | Header, nav, shared labels |
| `ingest` | `ingest.json` | IngestPanel |
| `retention` | `retention.json` | RetentionPanel |
| `performance` | `performance.json` | PerformancePanel |
| `deployment` | `deployment.json` | DeploymentPanel |
| `advanced` | `advanced.json` | AdvancedPanel |
| `output` | `output.json` | Report dashboard |
| `guide` | `guide.json` | GuideView sections |

Tooltip keys follow `{fieldKey}_tooltip` convention:
```json
{
  "dailyIngest": "Daily Ingest Volume",
  "dailyIngest_tooltip": "Raw uncompressed data arriving per day…"
}
```

---

## Deployment

Deployment to GitHub Pages is automatic on push to `maincd`:

```
.github/workflows/deploy.yml  →  npm run build  →  dist/  →  GitHub Pages
```

Docker images are built and pushed to `ghcr.io` on tagged releases:

```
.github/workflows/release.yml  →  docker build  →  ghcr.io/fjacquet/elk-sizer
```

To run the Docker image locally:

```bash
docker run -p 8080:80 ghcr.io/fjacquet/elk-sizer:latest
```

---

## Pull Request Checklist

- [ ] `npm run typecheck` passes with no errors
- [ ] `npm run lint` passes with no warnings
- [ ] `npm run test` passes
- [ ] New input fields have translation keys in all four locales (with `_tooltip` variants)
- [ ] New engine functions have unit tests
- [ ] `README.md` updated if user-visible features were added

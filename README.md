# ELK Sizer

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![CI](https://github.com/fjacquet/elk-sizer/actions/workflows/ci.yml/badge.svg)](https://github.com/fjacquet/elk-sizer/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/fjacquet/elk-sizer?sort=semver)](https://github.com/fjacquet/elk-sizer/releases/latest)

Browser-based Elasticsearch cluster sizing tool for on-premise Dell infrastructure. Helps engineers size Elastic clusters using Dell PowerEdge servers, PowerStore FC (SAN), and PowerScale/ECS (S3).

**[Live App](https://fjacquet.github.io/elk-sizer/)** · **[User Guide](https://fjacquet.github.io/elk-sizer/#guide)** · **[Architecture Advisor](https://fjacquet.github.io/elk-sizer/#advisor)**

## Features

- **Four calculation engines** — storage, cluster, hardware, and sustainability sizing
- **Tiered architecture** — hot, warm, cold, and frozen tier support with ILM lifecycle
- **Dell hardware mapping** — PowerEdge R660/R760/R7725, PowerStore FC SAN, PowerScale/ECS S3
- **CPU & memory selection** — choose CPU option and RAM per node; all sizing recalculates dynamically
- **Architecture Advisor** — real-time recommendations, warnings, and optimization suggestions
- **Inline tooltips** — every input field has a contextual explanation (hover the ⓘ icon)
- **Sustainability metrics** — PUE-adjusted power, CO2 emissions, and full TCO breakdown
- **Interactive Sankey diagram** — visualize data flow across tiers
- **VM vs bare metal comparison** — automatic overhead calculation
- **Export** — PDF, PowerPoint (PPTX), and YAML configuration export
- **Deep-linkable views** — `#guide`, `#advisor`, `#report`, `#config` URLs open specific views
- **Shareable URLs** — LZ-String compressed configuration state in URL hash
- **Internationalization** — English, French, German, and Italian

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173/elk-sizer/` in your browser.

## Commands

```bash
npm run dev           # Start dev server (hot reload)
npm run build         # Type check + production build
npm run typecheck     # TypeScript check only
npm run lint          # Biome check (format + lint)
npm run lint:fix      # Biome auto-fix
npm run test          # Run Vitest tests
npm run test:coverage # Tests with coverage report
```

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React 19 + TypeScript 5.x (strict mode) |
| State | Zustand 5.x with LZ-String URL persistence |
| Styling | Tailwind CSS 4.x (dark mode default) |
| Build | Vite 7.x |
| Testing | Vitest + Testing Library + fast-check |
| Linting | Biome (formatter + linter) |
| Visualization | D3-Sankey, Recharts |
| Export | jsPDF, PptxGenJS, js-yaml |
| i18n | react-i18next (EN, FR, DE, IT) |

## Project Documentation

| Document | Description |
|---|---|
| [User Guide](docs/user-guide.md) | How to use every panel, view, and feature |
| [Sizing Methodology](docs/sizing-methodology.md) | Formulas, constants, and calculation logic |
| [Architecture](docs/architecture.md) | Code structure, engines, store, and data flow |
| [Hardware Reference](docs/hardware-reference.md) | Dell hardware catalog and BOM logic |
| [Contributing](docs/contributing.md) | Development setup, conventions, testing |

## Architecture Overview

```
src/
├── engines/           # Four independent calculation engines (strategy pattern)
│   ├── storage/       # Per-tier capacity: compression, replication, watermark
│   ├── cluster/       # Node count, shard count, JVM heap sizing
│   ├── hardware/      # Dell model selection, BOM generation
│   └── sustainability/# Power draw, CO2 emissions, TCO
├── store/             # Zustand state (5 slices) + URL hash persistence
├── components/
│   ├── inputs/        # Five configuration panels with tooltips
│   ├── outputs/       # Report dashboard (Sankey, BOM, sustainability)
│   ├── guide/         # Accordion sizing guide (6 sections)
│   ├── advisor/       # Architecture Advisor view
│   └── common/        # Shared UI primitives (Slider, Select, Tooltip…)
├── hooks/             # useCalculations, useArchitectureAdvice, useClusterCalc…
├── data/              # Dell hardware JSON catalog
├── i18n/              # Translations (EN, FR, DE, IT) — 8 namespaces
└── types/             # TypeScript types for sizing, results, hardware
```

## License

MIT

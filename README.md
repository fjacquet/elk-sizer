# ELK Sizer

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Browser-based Elasticsearch cluster sizing tool for on-premise Dell infrastructure. Helps engineers size Elastic clusters using Dell PowerEdge servers, PowerStore FC (SAN), and PowerScale/ECS (S3).

## Features

- **Four calculation engines** — storage, cluster, hardware, and sustainability sizing
- **Tiered architecture** — hot, warm, cold, and frozen tier support with ILM lifecycle
- **Dell hardware mapping** — PowerEdge R660/R760, PowerStore FC SAN, PowerScale/ECS S3
- **Sustainability metrics** — PUE-adjusted power, CO2 emissions, and full TCO breakdown
- **Interactive Sankey diagram** — visualize data flow across tiers
- **VM vs bare metal comparison** — automatic overhead calculation
- **Export** — PDF, PowerPoint (PPTX), and YAML configuration export
- **In-app sizing guide** — 6-section accordion guide covering all sizing concepts
- **Internationalization** — English, French, German, and Italian
- **Shareable URLs** — LZ-String compressed configuration state in URL

## Quick Start

```bash
npm install
npm run dev
```

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

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 19 + TypeScript 5.x (strict mode) |
| State | Zustand 5.x with LZ-String URL persistence |
| Styling | Tailwind CSS 4.x (dark mode default) |
| Build | Vite 7.x |
| Testing | Vitest + Testing Library + fast-check |
| Linting | Biome (formatter + linter) |
| Visualization | D3-Sankey, Recharts |
| Export | jsPDF, PptxGenJS, js-yaml |
| i18n | react-i18next (EN, FR, DE, IT) |

## Architecture

The application uses a **strategy pattern** with four independent calculation engines:

- `src/engines/storage/` — Per-tier capacity calculation
- `src/engines/cluster/` — Node count, shard, JVM sizing
- `src/engines/hardware/` — Dell model selection, BOM generation
- `src/engines/sustainability/` — Power, CO2, TCO

State is managed via **five Zustand slices**: Ingest, Retention, Performance, Deployment, and Advanced.

## License

MIT

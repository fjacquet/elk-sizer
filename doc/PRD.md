# Product Requirements Document: ELK Sizer

## Overview
ELK Sizer is a browser-based Elasticsearch cluster sizing tool designed for engineers deploying Elastic Stack on Dell on-premise infrastructure.

## Problem Statement
Sizing an Elasticsearch cluster for on-premise Dell hardware is complex, involving multiple data tiers, storage types (SAN vs object storage), JVM heap constraints, shard limits, and VM overhead considerations. Engineers need a tool that translates business requirements (data volume, retention) into concrete hardware bills of materials.

## Target Users
- Infrastructure engineers planning Elastic deployments
- Pre-sales engineers creating Dell-based proposals
- Capacity planners estimating TCO for Elastic clusters

## Core Features

### 1. Data Ingest Configuration
- Daily ingest volume (1-10,000 GB/day)
- Compression codec selection (LZ4, DEFLATE, Best Compression)
- Replica count (0-3)
- Index count

### 2. Retention Policy
- Per-tier retention days: Hot (1-90), Warm (0-365), Cold (0-730), Frozen (0-3650)
- ILM (Index Lifecycle Management) toggle

### 3. Performance Parameters
- Search rate (queries/second)
- Indexing rate (docs/second)
- Concurrent searches

### 4. Deployment Configuration
- VM vs Bare Metal toggle
- Dell PowerEdge server model selection (R760, R660, R7725)
- Dell PowerStore SAN model selection (500T-9200T)
- Frozen tier backend: PowerScale or ECS
- Network speed: 10/25/100 GbE

### 5. Sizing Results
- **Cluster Summary**: Total nodes, storage, memory, estimated cost
- **Tier Breakdown**: Per-tier node count, storage, memory, JVM heap, shards
- **Data Flow Sankey Diagram**: Visual flow from raw ingest through tiers
- **Hardware BOM**: Dell server/storage bill of materials with rack units
- **VM vs BM Comparison**: Side-by-side showing overhead factors
- **Sustainability**: Power, CO2, TCO over project lifetime

### 6. Export
- PDF report with all sizing details
- YAML configuration export

### 7. Internationalization
- English, French, German, Italian (Swiss languages)

### 8. URL Sharing
- Complete configuration encoded in URL hash
- Copy-paste to share exact sizing scenarios

## Key Sizing Rules
- JVM Heap: 50% of RAM, never exceed 31 GB (compressed OOPs)
- Memory:Storage ratios: Hot 1:30, Warm 1:160, Cold 1:500, Frozen 1:1600
- Minimum 2 data nodes per tier
- Master nodes: 3 (small) or 5 (large clusters)
- VM overhead: 22% performance, 14% storage
- Shard limit: 20 per GB of JVM heap
- Target shard size: 50 GB

## Non-Functional Requirements
- Client-side SPA (no backend required)
- Works offline after initial load
- Mobile-responsive (split-screen desktop, stacked mobile)
- Dark mode default
- Build under 500 KB gzipped

# ELK Sizer — Research Findings

> Compiled from all planning and research sessions.
> This document captures the raw research that informed the tool's design, formulas, and hardware catalog.

---

## Table of Contents

1. [Project Genesis](#1-project-genesis)
2. [Primary Research Sources](#2-primary-research-sources)
3. [Core Sizing Formulas and Constants](#3-core-sizing-formulas-and-constants)
4. [IOPS Estimation](#4-iops-estimation)
5. [Dell Hardware Research](#5-dell-hardware-research)
6. [Elasticsearch Architecture Research](#6-elasticsearch-architecture-research)
7. [VM vs Bare Metal Research](#7-vm-vs-bare-metal-research)
8. [Sustainability and TCO Research](#8-sustainability-and-tco-research)
9. [Architecture Decisions](#9-architecture-decisions)
10. [UI/UX Decisions](#10-uiux-decisions)
11. [Architecture Advisor Design](#11-architecture-advisor-design)
12. [Testing Strategy](#12-testing-strategy)
13. [Internationalization](#13-internationalization)
14. [Rejected Approaches](#14-rejected-approaches)
15. [Key File Locations](#15-key-file-locations)

---

## 1. Project Genesis

### Problem Statement

Engineers sizing Elasticsearch clusters for Dell on-premise infrastructure had no dedicated tool. Sizing was done manually from PDFs, spreadsheets, and guesswork. This created inconsistency and under/over-provisioning.

### Requirements

- Browser-based, no backend (works offline, no auth needed)
- Covers full ILM lifecycle: Hot → Warm → Cold → Frozen
- Dell PowerEdge servers, PowerStore FC SAN, PowerScale/ECS object storage
- VM vs Bare Metal comparison
- Export to PDF, YAML, PPTX
- Multi-language (EN, FR, DE, IT)
- Shareable URLs (URL-encoded state)

---

## 2. Primary Research Sources

### 2.1 Dell/Elastic PDFs Analysed

**"Infrastructure Elastic Stack On-Premise Dell.pdf"** (31 pages, French)
- On-premise Elastic deployment on PowerStore FC + PowerEdge
- PowerEdge R760 (hot/warm): 2× Xeon Platinum 8460Y+, 64–256 GB RAM
- PowerEdge R660 (master): 2× Xeon Gold 6430, 16–32 GB RAM
- PowerStore NVMe/FC, QoS policy "High Performance" for Elasticsearch
- MPIO: `vendor=DellEMC, product=PowerStore, path_selector=queue-length 0, failback=immediate`
- Shard Allocation Awareness via `node.attr.san_id` tagging
- Linux: XFS filesystem, `vm.swappiness=1`, `vm.max_map_count=262144`, `bootstrap.memory_lock=true`

**"elasticsearch-sizing-and-capacity-planning.pdf"** (20 pages, Elastic official)
- Node roles: Data = extreme storage / high memory, Master = low all
- JVM heap rule: 50% of RAM, max 30 GB (tool uses 31 GB — exact compressed OOPs threshold)
- Storage: SSD for hot, HDD for warm/frozen; DAS/SAN recommended; NAS explicitly discouraged
- Architecture: Cluster → Node → Index → Shard → Segment → Document

**"h19217-deploying-the-elastic-stack-with-searchable-snapshots-and-frozen-tier.pdf"** (20 pages, Dell ECS guide)
- Two S3 buckets: `elastic-snapshots` (regular snapshots) + `elastic-frozendata` (frozen tier)
- ILM: Hot (rollover at 100 GB/1 day) → Frozen (searchable snapshot on ecs-frozen-repo)
- Index templates: `number_of_shards: 3`, `number_of_replicas: 1`
- **Key finding**: Replica shards NOT required on frozen tier — object store handles durability
- Path-style S3 access required for ECS/PowerScale (`path_style_access = true`)

**Elastic APM Storage Sizing Guide** (fetched from elastic.co)
- ~1 KB per unsampled transaction, ~4 KB per span with 10 stack frames
- 80–90% compression ratios observed in practice
- Example: 100 txn/s for 1 hour ≈ 50 MB disk

---

## 3. Core Sizing Formulas and Constants

### 3.1 Storage Engine

```
rawStorageGB         = dailyIngestGB × retentionDays × compressionRatio
effectiveStorageGB   = rawStorageGB × (1 + replicaCount)
watermarkBufferedGB  = effectiveStorageGB × 1.25 × 1.05
```

Note: `1.25` = 25% watermark headroom; `1.05` = 5% filesystem overhead (doc values, mappings, segment overhead).
Frozen tier always uses `replicaCount = 0` (object storage handles durability).

### 3.2 Compression Ratios

| Codec            | Ratio | Effect                     |
|------------------|-------|----------------------------|
| LZ4              | 1.10  | +10% (fast, default)       |
| DEFLATE          | 0.85  | −15%                       |
| Best Compression | 0.70  | −30%                       |

### 3.3 Memory:Storage Ratios per Tier

| Tier   | Ratio       | Numeric  | Rationale                                       |
|--------|-------------|----------|-------------------------------------------------|
| Hot    | 1:30        | 0.0333   | Active indexing + frequent queries, large cache |
| Warm   | 1:160       | 0.00625  | Read-only, less active caching                  |
| Cold   | 1:500       | 0.002    | Rarely queried, minimal memory footprint        |
| Frozen | 1:1600      | 0.000625 | Searchable snapshots on object store            |

### 3.4 Cluster Sizing Formulas

```
requiredMemoryGB = watermarkBufferedGB × memoryRatio[tier]
rawNodeCount     = ceil(requiredMemoryGB / memoryPerNode)
nodeCount        = max(rawNodeCount, 2)         // minimum 2 nodes per active tier

jvmHeapGB        = min(floor(memoryPerNode × 0.5), 31)

targetShardSizeGB = 50
shardCount        = max(ceil(watermarkBufferedGB / targetShardSizeGB), nodeCount)
```

### 3.5 Infrastructure Node Rules

| Role          | Count formula                        | Memory | CPU Cores |
|---------------|--------------------------------------|--------|-----------|
| Master        | 3 (≤20 data nodes) / 5 (>20)         | 16 GB  | 4         |
| Ingest        | max(2, ceil(dataNodes / 10))          | 32 GB  | 8         |
| Coordinating  | max(2, ceil(dataNodes / 15))          | 32 GB  | 8         |

### 3.6 CPU Cores per Tier

| Tier   | Cores/Node |
|--------|-----------|
| Hot    | 16         |
| Warm   | 8          |
| Cold   | 4          |
| Frozen | 4          |

### 3.7 Shard Utilisation Health

```
totalHeapGB          = sum(jvmHeapGB × nodeCount) across all data tiers
maxShardsCapacity    = totalHeapGB × 20       // Elastic rule: 20 shards/GB heap
shardUtilization     = totalShards / maxShardsCapacity
```

- > 80%: Critical — cluster instability risk
- 60–80%: Warning — approaching limit
- < 60%: Healthy

### 3.8 Key Constants

```typescript
WATERMARK_BUFFER      = 1.25   // 25% free space headroom
FILESYSTEM_OVERHEAD   = 0.05   // doc values, mappings, segment overhead
JVM_HEAP_MAX_GB       = 31     // compressed OOPs threshold (not 30 GB)
JVM_HEAP_RATIO        = 0.50   // 50% of node RAM
MAX_SHARDS_PER_GB_HEAP = 20
VM_PERF_FACTOR        = 0.78   // VMware CPU/perf overhead (~22%)
VM_STORAGE_FACTOR     = 0.86   // VMware storage overhead (~14%)
MIN_NODES_PER_TIER    = 2
MASTER_NODE_SMALL     = 3      // clusters ≤ 20 data nodes
MASTER_NODE_LARGE     = 5      // clusters > 20 data nodes
LARGE_CLUSTER_THRESHOLD = 20
SHARD_SIZE_TARGET_GB  = 50
```

---

## 4. IOPS Estimation

> **Status: planned — not yet implemented**

### 4.1 Why IOPS Matter

Capacity alone does not guarantee performance. Elasticsearch generates high random read/write IOPS from:
- Lucene segment merges (hot tier, indexing-heavy workloads)
- Translog fsync (every 5 seconds by default)
- Fielddata/doc-values access patterns (warm/cold query bursts)

Without IOPS validation, a cluster that looks correctly sized by storage and memory can saturate the SAN and show search latency spikes or indexing backlogs.

### 4.2 IOPS Estimation Model

#### Hot Tier (Write-Heavy)

```
// Indexing IOPS (writes)
indexingIOPS  = indexingRateMBs × 1024 / avgDocSizeKB × IOPS_WRITE_AMPLIFICATION
              // write amplification ≈ 3–5× due to segment merges + translog

// Search IOPS (reads)
searchIOPS    = concurrentSearches × SHARDS_PER_SEARCH × IOPS_PER_SHARD_SEARCH
              // ≈ concurrentSearches × 3 shards × 10–50 IOPS per shard
```

Practical rule of thumb (from Elastic webinar):
- **1 GB/hour ingest → ~500–1,000 IOPS on hot nodes**
- **Write amplification factor: 3–5×** for segment merges

#### Warm/Cold Tier (Read-Only)

```
searchIOPS = searchRate × avgShardsHit × IOPS_PER_SHARD
           // warm: ~10–30 IOPS per shard query
           // cold: ~5–15 IOPS per shard query (less active)
```

#### Frozen Tier

- No local IOPS for data (stored in S3 object storage)
- Local cache IOPS only for recently accessed partial segments
- PowerScale/ECS: IOPS determined by object store throughput, not disk spindles

### 4.3 PowerStore IOPS Specifications

| Model          | Max IOPS    | Latency   | Notes                                 |
|----------------|-------------|-----------|---------------------------------------|
| PowerStore 500T  | 150,000   | 0.5 ms    | Suitable for small clusters           |
| PowerStore 1200T | 350,000   | 0.4 ms    | Medium clusters, heavy ingest         |
| PowerStore 3200T | 600,000   | 0.3 ms    | Large clusters                        |
| PowerStore 5200T | 1,000,000 | 0.25 ms   | Enterprise hot+warm combined          |
| PowerStore 9200T | 2,000,000 | 0.2 ms    | Largest deployments                   |

### 4.4 IOPS Sizing Rules

**Hot Tier IOPS Budget**

```
estimatedIndexingIOPS = dailyIngestGB × 1024 / 86400 × 3   // 3× write amplification
estimatedSearchIOPS   = searchRate × concurrentSearches × 20
totalRequiredIOPS     = estimatedIndexingIOPS + estimatedSearchIOPS
```

**Required PowerStore IOPS**: Select the model whose Max IOPS ≥ `totalRequiredIOPS × 1.3` (30% headroom).

**Warm Tier IOPS Budget**

```
warmSearchIOPS = searchRate × 0.3 × 15   // 30% of searches hit warm, ~15 IOPS/search
```

### 4.5 IOPS Health Indicators (Proposed)

| Utilisation | Status   | Action                                          |
|-------------|----------|-------------------------------------------------|
| < 50%       | Healthy  | —                                               |
| 50–75%      | Warning  | Monitor — approaching saturation at peak        |
| > 75%       | Critical | Upgrade PowerStore tier or reduce hot retention |

### 4.6 References

- Elastic sizing webinar: ~500–1,000 IOPS per 1 GB/hour ingest on NVMe SAN
- Dell PowerStore technical specs: `dell-powerstore.json`
- Write amplification 3–5× is a well-established Lucene characteristic (segment merges, translog fsync)

---

## 5. Dell Hardware Research

### 5.1 PowerEdge Servers

**PowerEdge R760** — Hot & Warm data tiers (2U, Gen 16G, Intel)

| Spec          | Value                                          |
|---------------|------------------------------------------------|
| Max RAM       | 2,048 GB (32 DIMM slots)                       |
| Drive bays    | up to 16 × 2.5"                               |
| Network       | 2 × 25GbE SFP28 + 2 × 1GbE RJ45               |
| Max power     | 1,200 W / Idle: 350 W                          |
| PSU           | 1,400 W                                        |
| CPU options   | Xeon Gold 6430 (32c/2.1 GHz), Xeon Platinum 8470 (52c/2.0 GHz) |

**PowerEdge R660** — Master, Ingest, Coordinating nodes (1U, Gen 16G, Intel)

| Spec          | Value                                          |
|---------------|------------------------------------------------|
| Max RAM       | 1,024 GB (16 DIMM slots)                       |
| Drive bays    | up to 10 × 2.5"                               |
| Network       | 2 × 25GbE SFP28 + 2 × 1GbE RJ45               |
| Max power     | 900 W / Idle: 250 W                            |
| PSU           | 1,100 W                                        |
| CPU options   | Xeon Gold 6430 (32c), Xeon Silver 4416+ (20c)  |

**Key design rule**: R660 always used for infrastructure roles (master/ingest/coordinating) regardless of user's data node choice. 1U density is optimal for these low-storage roles.

**PowerEdge R7725** — Memory-intensive Hot tier (2U, Gen 16G, AMD EPYC)

| Spec          | Value                                          |
|---------------|------------------------------------------------|
| Max RAM       | 4,096 GB (24 DIMM slots)                       |
| Drive bays    | up to 24 × 2.5" or 3.5"                       |
| Network       | 2 × 100GbE QSFP56 + 2 × 25GbE SFP28           |
| Max power     | 2,000 W / Idle: 500 W                          |
| PSU           | 2,400 W                                        |
| CPU options   | EPYC 9554 (64c/3.1 GHz), EPYC 9354 (32c/3.25 GHz) |

**Key insight**: RAM above 62 GB (the 2× JVM heap hard cap) goes entirely to the OS page cache, which Lucene uses heavily for segment caching. More RAM → larger Lucene cache → faster queries.

### 5.2 PowerStore FC SAN (Hot & Warm tiers)

NVMe/FC protocol, 32 Gb Fibre Channel.

| Model            | Max Raw  | Max Effective | Max IOPS  | Latency  | FC Ports    | Power   | Rack U |
|------------------|----------|---------------|-----------|----------|-------------|---------|--------|
| PowerStore 500T  | 96 TB    | 192 TB        | 150,000   | 0.5 ms   | 4 × 32Gb FC | 800 W   | 2U     |
| PowerStore 1200T | 192 TB   | 384 TB        | 350,000   | 0.4 ms   | 8 × 32Gb FC | 1,200 W | 2U     |
| PowerStore 3200T | 384 TB   | 768 TB        | 600,000   | 0.3 ms   | 8 × 32Gb FC | 1,800 W | 4U     |
| PowerStore 5200T | 576 TB   | 1,152 TB      | 1,000,000 | 0.25 ms  | 16 × 32Gb FC| 2,400 W | 4U     |
| PowerStore 9200T | 1,152 TB | 2,304 TB      | 2,000,000 | 0.2 ms   | 16 × 32Gb FC| 3,600 W | 8U     |

### 5.3 PowerScale Object Storage (Frozen tier, S3)

Scale-out NAS with S3 Object Protocol. Path-style S3 access required.

| Model             | Node Capacity | Max Cluster | S3 Throughput | Network                     | Power/Node | Rack U |
|-------------------|---------------|-------------|---------------|-----------------------------|------------|--------|
| PowerScale F710   | 92 TB         | 1.5 PB      | 5 GB/s        | 4 × 25GbE SFP28             | 750 W      | 1U     |
| PowerScale F910   | 184 TB        | 3 PB        | 10 GB/s       | 2 × 100GbE + 2 × 25GbE      | 1,100 W    | 2U     |
| PowerScale H7000  | 480 TB        | 10 PB       | 3 GB/s        | 4 × 25GbE SFP28             | 600 W      | 4U     |
| PowerScale A3100  | 960 TB        | 50 PB       | 2 GB/s        | 2 × 25GbE SFP28             | 500 W      | 4U     |

### 5.4 Dell ECS (Alternative to PowerScale for Frozen tier)

- Native S3-compatible API
- ~500 TB effective capacity per node
- 800 W per node

### 5.5 Network Connectivity Model

| Connection              | Spec                                                   |
|-------------------------|--------------------------------------------------------|
| Server → TOR switch     | 25 GbE standard / 100 GbE for R7725/high ingest        |
| TOR switch count        | max(2, ceil(totalEthPorts / 48))                       |
| Server → PowerStore     | 32 Gb Fibre Channel                                    |
| HA paths per server     | 2 Ethernet (active/active bonding or ECMP)             |

---

## 6. Elasticsearch Architecture Research

### 6.1 ILM Tier Architecture

| Tier   | Storage     | Role                                      | Memory Ratio | Replicas |
|--------|-------------|-------------------------------------------|--------------|----------|
| Hot    | PowerStore  | Active indexing + recent search           | 1:30         | ≥1       |
| Warm   | PowerStore  | Read-only, aged data                      | 1:160        | ≥1       |
| Cold   | PowerStore  | Infrequent access, compliance             | 1:500        | ≥1       |
| Frozen | PowerScale/ECS | Searchable snapshots on object store  | 1:1600       | 0        |

### 6.2 Searchable Snapshots (Frozen Tier)

Frozen tier allows querying data stored in S3 without downloading it entirely:
- Two S3 repositories required: `elastic-snapshots` + `elastic-frozendata`
- Path-style access required: `path_style_access = true`
- Replicas not needed — object store handles durability
- ILM rollover: Hot (100 GB or 1 day) → Frozen (searchable snapshot)

### 6.3 Shard Allocation Awareness for SAN

Critical for PowerStore SAN to prevent SPOF. Nodes tagged with SAN zone:

```yaml
node.attr.san_id: powerstore-01
```

### 6.4 Node Roles Summary

| Role         | Storage | JVM | Min RAM | Rec RAM | Min Cores | Rec Cores |
|--------------|---------|-----|---------|---------|-----------|-----------|
| data_hot     | Yes     | Yes | 32 GB   | 64 GB   | 8         | 16        |
| data_warm    | Yes     | Yes | 32 GB   | 64 GB   | 4         | 8         |
| data_cold    | Yes     | Yes | 16 GB   | 32 GB   | 2         | 4         |
| data_frozen  | No      | Yes | 16 GB   | 32 GB   | 2         | 4         |
| master       | No      | Yes | 8 GB    | 16 GB   | 2         | 4         |
| ingest       | No      | Yes | 16 GB   | 32 GB   | 4         | 8         |
| coordinating | No      | Yes | 16 GB   | 32 GB   | 4         | 8         |

### 6.5 Linux OS Tuning Requirements

```bash
# Filesystem
mkfs.xfs /dev/sdX         # XFS, not ext4

# Kernel settings
vm.swappiness=1           # near-zero swap
vm.max_map_count=262144   # mmap for Lucene
bootstrap.memory_lock=true  # prevent JVM heap swapping

# MPIO for PowerStore FC
vendor=DellEMC
product=PowerStore
path_selector=queue-length 0
failback=immediate
```

---

## 7. VM vs Bare Metal Research

### 7.1 Recommendation

| Tier              | Recommendation       | Reason                                          |
|-------------------|---------------------|-------------------------------------------------|
| Hot               | **Bare metal**       | Latency-sensitive, active indexing              |
| Warm / Cold       | VM acceptable        | Read-only, throughput more important than latency |
| Frozen            | VM acceptable        | Data on object store, local node is thin        |
| Infrastructure    | VM acceptable        | Master/ingest/coordinating — not storage-bound  |

### 7.2 Overhead Factors (VMware, tuned vSphere)

| Factor        | Value | Impact                      |
|---------------|-------|-----------------------------|
| VM_PERF_FACTOR | 0.78 | 22% CPU/performance overhead |
| VM_STORAGE_FACTOR | 0.86 | 14% storage overhead (VMDKs on PowerStore FC) |

When VM deployment selected, the tool adjusts:
```
adjustedNodeCount  = ceil(nodeCount / 0.78)    // +28% more nodes
adjustedStorageGB  = storageGB / 0.86          // +16% more storage
```

---

## 8. Sustainability and TCO Research

### 8.1 Carbon Intensity by Region

| Region      | gCO2/kWh |
|-------------|-----------|
| Switzerland | 30        |
| France      | 55        |
| Germany     | 350       |
| Italy       | 250       |
| UK          | 200       |
| US Average  | 400       |

### 8.2 Power Formula

```
totalPowerWatts    = serverPower + storagePower + objectStoragePower + networkPower
pueAdjustedWatts   = totalPowerWatts × PUE
annualEnergyKWh    = pueAdjustedWatts × 8760 / 1000
annualCO2Kg        = annualEnergyKWh × carbonFactor / 1000
networkSwitchPower = 500 W per switch (flat estimate)
```

### 8.3 TCO Formula

```
hardwareCostUSD  = server count × $15,000 + SAN units × $50,000 + object nodes × $30,000
energyCostUSD    = annualEnergyCostUSD × projectYears
licenseCostUSD   = totalNodes × $50/month × 12 × projectYears
totalTCO         = hardwareCostUSD + energyCostUSD + licenseCostUSD
```

### 8.4 Rough Unit Costs

| Component             | Unit Cost   |
|-----------------------|-------------|
| PowerEdge server      | $15,000     |
| PowerStore unit       | $50,000     |
| PowerScale/ECS node   | $30,000     |
| Ethernet switch       | $10,000     |
| Elastic license       | $50/node/month |

---

## 9. Architecture Decisions

### 9.1 Technology Stack

Chose the same stack as the existing "raidy" project for consistency:

| Layer      | Choice                            | Rationale                         |
|------------|-----------------------------------|-----------------------------------|
| UI         | React 19 + TypeScript strict      | Type-safe, familiar to team       |
| State      | Zustand 5 + LZ-String URL persist | No backend, shareable URLs        |
| Styling    | Tailwind CSS 4, dark mode default | Fast iteration, design system     |
| Build      | Vite 7                            | Fast dev + HMR                    |
| Test       | Vitest + Testing Library + fast-check | Fast, browser-like, property-based |
| Lint/Format| Biome                             | Single tool, single quotes, no semicolons |

### 9.2 Engine Strategy Pattern

Four independent pure-function engines with no React dependencies:
1. **Storage engine** — per-tier capacity from ingest + retention
2. **Cluster engine** — node count from memory:storage ratios
3. **Hardware engine** — Dell model selection + BOM assembly
4. **Sustainability engine** — power, CO2, TCO

Orchestration: React hooks with `useMemo`.

### 9.3 Five Zustand Slices

| Slice            | Key fields                                               |
|------------------|----------------------------------------------------------|
| IngestSlice      | dailyIngestGB, compressionCodec, replicaCount, indexCount |
| RetentionSlice   | hotDays, warmDays, coldDays, frozenDays, ilmEnabled      |
| PerformanceSlice | searchRate, indexingRate, concurrentSearches             |
| DeploymentSlice  | deploymentType, serverModel, cpuOption, memoryPerNode, storageModel, frozenBackend, networkSpeed |
| AdvancedSlice    | pue, carbonRegion, jvmHeapOverride, shardsPerIndex, unitSystem, electricityCostPerKwh, projectYears |

All state serialised to URL hash via LZ-String.

### 9.4 Static Data Files

Dell hardware in static JSON — no API dependency, works offline:
- `src/data/dell-servers.json`
- `src/data/dell-powerstore.json`
- `src/data/dell-powerscale.json`
- `src/data/elastic-node-roles.json`

Trade-off: Manual update required for new Dell models.

---

## 10. UI/UX Decisions

### 10.1 Layout — Cockpit Split-Screen

| View        | Hash        | Content                          |
|-------------|-------------|----------------------------------|
| Config      | `#config`   | All 5 input panels               |
| Report      | `#report`   | Calculation results dashboard    |
| Advisor     | `#advisor`  | Architecture Advisor             |
| Guide       | `#guide`    | Sizing reference guide           |

Desktop: InputSidebar (left) + OutputDashboard (right) always visible.
Mobile: Stacked layout with bottom navigation bar.

### 10.2 Input Panels

1. Data Ingest — daily ingest GB, compression, replicas, index count
2. Retention — days per tier, ILM toggle
3. Performance — search rate, indexing rate, concurrent searches
4. Deployment — VM/BM toggle, server/storage model, CPU option, RAM, frozen backend, network
5. Advanced — PUE, carbon region, JVM override, shards/index, unit system, electricity cost, project years

### 10.3 Output Components

1. Cluster Summary Cards — total nodes, storage, memory, cost, shard gauge
2. Tier Breakdown Table — per-tier node count, memory, JVM, storage, shards
3. Sankey Diagram (D3) — data flow: ingest → compression → replication → watermark → tier storage
4. Hardware BOM Table — server models, PowerStore units, PowerScale/ECS nodes, rack units
5. VM Comparison — side-by-side bare metal vs VM when VM selected
6. Sustainability Cards — power, CO2, TCO breakdown

### 10.4 Export Formats

| Format | Tool                 | Content                              |
|--------|----------------------|--------------------------------------|
| PDF    | jsPDF + autotable    | Full report                          |
| PPTX   | pptxgenjs            | 5-slide deck (title, summary, tiers, BOM, sustainability) |
| YAML   | js-yaml              | Machine-readable config snapshot     |

### 10.5 Tooltip Convention

All input fields have `ⓘ` tooltips. Key: `{fieldKey}_tooltip`. Fallback to English.

---

## 11. Architecture Advisor Design

### 11.1 Topology Patterns Detected

| Pattern              | Criteria                  |
|----------------------|---------------------------|
| Hot-Only             | 1 active tier             |
| Hot-Warm             | 2 tiers (hot + warm)      |
| Hot-Warm-Cold        | 3 tiers, no frozen        |
| Full 4-Tier (Optimal)| Includes frozen           |

### 11.2 Warning Categories

| Severity | Condition                        | Message                                                      |
|----------|----------------------------------|--------------------------------------------------------------|
| Critical | Zero replicas                    | No HA — set replicas ≥ 1 for production                      |
| Critical | Shard utilisation > 80%          | Reduce index count, increase shard size, or add nodes        |
| Warning  | Shard utilisation 60–80%         | Approaching limit — monitor closely                          |
| Warning  | VM overhead in use               | Bare metal recommended for hot tier                          |
| Info     | Frozen not enabled, long retention| Enable frozen tier for cost efficiency                       |
| Info     | Cluster > 3 nodes                | Enable zone awareness                                        |

### 11.3 Reference Architecture Scale

| Pattern    | Scale             | Data Nodes | Retention  |
|------------|-------------------|------------|------------|
| Small      | < 100 GB/day      | 4–6        | Short      |
| Medium     | 100–1,000 GB/day  | 10–20      | Medium     |
| Large      | 1–10 TB/day       | 30–50      | Full ILM   |
| Enterprise | > 10 TB/day       | 50+        | Full 4-tier + frozen |

---

## 12. Testing Strategy

- **Framework**: Vitest + Testing Library + fast-check
- **Coverage threshold**: 75% on `src/engines/` and `src/utils/`
- **Engine tests**: pure function unit tests, no mocking
- **Hook tests**: `renderHook` with store provider
- **Property-based**: fast-check for boundary conditions (`dailyIngestGB=0`, `hotDays=1`, etc.)

Key invariant tested: `jvmHeapGB ≤ 31` regardless of RAM per node.

---

## 13. Internationalization

- 4 languages: EN, FR, DE, IT
- Swiss locale variants: `en-CH`, `fr-CH`, `de-CH`, `it-CH`
- 8 namespaces: `common`, `ingest`, `retention`, `performance`, `deployment`, `advanced`, `output`, `guide`
- 32 JSON files (4 × 8)
- Fallback: English for untranslated keys
- Tooltip keys: `{fieldKey}_tooltip`

---

## 14. Rejected Approaches

| Rejected Approach             | Reason                                                     |
|-------------------------------|------------------------------------------------------------|
| API-backed backend            | No server cost, offline-capable SPA preferred              |
| NAS for hot/warm storage      | Elastic official guide explicitly recommends against NAS   |
| Replicas on frozen tier       | Object store handles durability; replicas waste storage    |
| Virtual-hosted S3 style       | ECS + PowerScale require path-style access                 |
| Single server model for all roles | Infrastructure roles use R660 always (1U density optimal) |
| Fetching Dell docs from InfoHub | Blocked by Google reCAPTCHA; user provided local PDFs     |

---

## 15. Key File Locations

```
src/types/sizing.ts                          — Core types and SIZING constants
src/types/hardware.ts                        — Dell hardware types
src/types/results.ts                         — Engine output types
src/data/dell-servers.json                   — PowerEdge R760/R660/R7725 specs
src/data/dell-powerstore.json                — PowerStore 500T–9200T specs
src/data/dell-powerscale.json                — PowerScale F710/F910/H7000/A3100 specs
src/data/elastic-node-roles.json             — ES node role definitions
src/engines/storage/index.ts                 — Storage calculation engine
src/engines/storage/helpers/tierStorage.ts   — Per-tier storage formula
src/engines/cluster/index.ts                 — Cluster sizing engine
src/engines/cluster/helpers/nodeCalculator.ts — Node count formula
src/engines/hardware/index.ts                — BOM assembly engine
src/engines/hardware/helpers/serverSelector.ts — Server/CPU selection
src/engines/hardware/strategies/powerstoreStrategy.ts — PowerStore unit count
src/engines/hardware/strategies/powerscaleStrategy.ts — PowerScale node count
src/engines/sustainability/index.ts          — Power/CO2/TCO engine
src/engines/sustainability/helpers/carbonFactors.ts — Carbon intensity constants
src/hooks/useCalculations.ts                 — Main orchestrator hook
src/hooks/useArchitectureAdvice.ts           — Architecture Advisor hook
src/store/configStore.ts                     — Zustand store composition
src/store/urlStorage.ts                      — LZ-String URL persistence adapter
src/store/slices/                            — Five store slices
docs/sizing-methodology.md                   — All formulas documented
docs/hardware-reference.md                   — Dell hardware catalog
docs/user-guide.md                           — End-user documentation
docs/architecture.md                         — Developer architecture documentation
doc/ADR-001-architecture.md                  — Architecture decision record
doc/PRD.md                                   — Product requirements document
```

---

*Last updated: 2026-02-27*

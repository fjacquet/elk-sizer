# Sizing Methodology

This document describes the formulas, constants, and decision logic used by ELK Sizer's four calculation engines.

---

## Constants

Defined in `src/types/sizing.ts` under the `SIZING` object:

| Constant | Value | Purpose |
|---|---|---|
| `JVM_HEAP_MAX_GB` | 31 GB | Hard cap on JVM heap (compressed OOPs threshold) |
| `JVM_HEAP_RATIO` | 0.50 | Heap is 50% of node RAM |
| `MAX_SHARDS_PER_GB_HEAP` | 20 | Elasticsearch recommended shard density limit |
| `WATERMARK_BUFFER` | 1.25 | 25% headroom above Elasticsearch disk watermark |
| `VM_PERF_FACTOR` | 0.78 | VM effective CPU vs bare metal |
| `VM_STORAGE_FACTOR` | 0.86 | VM effective storage vs bare metal |
| `MIN_NODES_PER_TIER` | 2 | Minimum data nodes per active tier |
| `MASTER_NODE_COUNT_SMALL` | 3 | Master nodes for clusters ≤ 20 data nodes |
| `MASTER_NODE_COUNT_LARGE` | 5 | Master nodes for clusters > 20 data nodes |
| `LARGE_CLUSTER_THRESHOLD` | 20 | Data node count that triggers large-cluster rules |

---

## Storage Engine (`src/engines/storage/`)

Calculates required storage per tier before hardware selection.

### Compression Ratios

| Codec | Ratio applied |
|---|---|
| `lz4` | 1.10 (10% size increase vs raw — fast indexing) |
| `deflate` | 0.85 (15% reduction) |
| `best_compression` | 0.70 (30% reduction) |

### Per-Tier Storage Formula

For each tier with `retentionDays > 0`:

```
rawStorageGB = dailyIngestGB × retentionDays
effectiveStorageGB = rawStorageGB × compressionRatio × (1 + replicaCount) × 1.10
watermarkBufferedGB = effectiveStorageGB × WATERMARK_BUFFER
```

The 1.10 factor accounts for Elasticsearch indexing overhead (doc values, mappings, segments).

---

## Cluster Engine (`src/engines/cluster/`)

Calculates node count, JVM heap, and shard count for each tier and infrastructure role.

### Memory:Storage Ratios

These ratios determine how much RAM is needed per unit of stored data:

| Tier | Ratio | Rationale |
|---|---|---|
| Hot | 1 : 30 | Active indexing and frequent queries need large OS page cache |
| Warm | 1 : 160 | Read-only; less active caching required |
| Cold | 1 : 500 | Rarely queried; minimal memory footprint |
| Frozen | 1 : 1600 | Searchable snapshots; data lives on object storage |

### Data Node Count

```
requiredMemoryGB = watermarkBufferedGB × memoryRatio[tier]
rawNodeCount = ceil(requiredMemoryGB / memoryPerNode)
nodeCount = max(rawNodeCount, MIN_NODES_PER_TIER)
```

Where `memoryPerNode` is the user-selected RAM per data node (default 256 GB).

### JVM Heap

```
jvmHeapGB = min(floor(memoryPerNode × JVM_HEAP_RATIO), JVM_HEAP_MAX_GB)
           = min(floor(memoryPerNode × 0.5), 31)
```

The 31 GB cap preserves compressed ordinary object pointers (OOPs), which provide a ~30% JVM performance benefit over larger heap sizes.

### Shard Count

```
targetShardSizeGB = 50   # per tier
shardCount = max(
  ceil(watermarkBufferedGB / targetShardSizeGB),
  nodeCount                # at least 1 shard per node
)
```

### Infrastructure Nodes

These are fixed-formula, not data-driven:

| Role | Count | Memory | CPU cores |
|---|---|---|---|
| Master | 3 (small) or 5 (large) | 16 GB | 4 |
| Ingest | max(2, ceil(dataNodes / 10)) | 32 GB | 8 |
| Coordinating | max(2, ceil(dataNodes / 15)) | 32 GB | 8 |

### Shard Utilization

```
totalHeapGB = sum over data tiers of (jvmHeapGB × nodeCount)
maxShardsCapacity = totalHeapGB × MAX_SHARDS_PER_GB_HEAP
shardUtilization = totalShards / maxShardsCapacity
```

Values above 0.8 (80%) are flagged as critical.

### VM Overhead

When `deploymentType === 'vm'`, the hardware engine adjusts:

```
adjustedNodeCount = ceil(nodeCount / VM_PERF_FACTOR)   # ÷ 0.78 ≈ +28%
adjustedStorageGB = storageGB / VM_STORAGE_FACTOR       # ÷ 0.86 ≈ +16%
```

---

## Hardware Engine (`src/engines/hardware/`)

Maps calculated node requirements to specific Dell PowerEdge models and generates a Bill of Materials.

### Server Selection

**Data tiers** (`selectServerForTier`):

1. If the user has selected a specific server model, use it
2. Otherwise pick the first server whose `recommendedTier` matches the tier
3. CPU: prefer the user's selected CPU; fall back to the first option that meets core requirements; default to `cpuOptions[0]`
4. Memory: `min(memoryPerNodeGB, server.maxMemoryGB)`
5. Drive count and capacity are calculated from per-node storage ÷ drive count

**Infrastructure roles** (`selectServerForRole`):

Always uses the **PowerEdge R660** (1U, efficient) for master, ingest, and coordinating nodes.

### Storage Selection

**Hot/warm SAN** — PowerStore units:

The engine selects the user-chosen PowerStore model and calculates how many units cover total hot + warm storage.

**Cold/frozen object storage:**

- PowerScale: selects appropriate node model and calculates node count
- ECS: estimated at 500 TB effective capacity per node

### Cost Estimate

Rough order-of-magnitude estimates (not list prices):

| Component | Unit cost |
|---|---|
| PowerEdge server | $15,000 |
| PowerStore unit | $50,000 |
| PowerScale / ECS node | $30,000 |
| Ethernet switch | $10,000 |

---

## Sustainability Engine (`src/engines/sustainability/`)

Calculates environmental and financial impact.

### Power

```
totalPowerWatts = sum of (server.maxPowerWatts × nodeCount) for all BOM entries
pueAdjustedWatts = totalPowerWatts × PUE
annualEnergyKWh = pueAdjustedWatts × 8760 / 1000
```

### CO2

```
annualCO2Kg = annualEnergyKWh × carbonIntensity[region]   # gCO2/kWh ÷ 1000
```

Carbon intensity by region (gCO2/kWh):

| Region | gCO2/kWh |
|---|---|
| Switzerland | 12 |
| France | 58 |
| Germany | 350 |
| Italy | 233 |
| UK | 233 |
| US Average | 420 |

### TCO (5-year default)

```
hardwareCostUSD   = estimatedCostUSD (from hardware engine)
energyCostUSD     = annualEnergyCostUSD × projectYears
licenseCostUSD    = totalNodes × $3,000 × projectYears   # estimated Elastic license
totalTCO          = hardwareCostUSD + energyCostUSD + licenseCostUSD
```

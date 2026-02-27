# ELK Sizer — User Guide

ELK Sizer is a browser-based tool that calculates the hardware required to run an Elasticsearch cluster on Dell on-premise infrastructure. You fill in your workload parameters on the left; the right panel shows the resulting cluster topology, hardware BOM, and sustainability metrics — updating in real time.

**Live app:** https://fjacquet.github.io/elk-sizer/

---

## Navigation

The application has four views accessible from the header (desktop) or bottom bar (mobile):

| View | URL fragment | Description |
|---|---|---|
| Configuration | `#config` | Input panels — fill in your workload |
| Report | `#report` | Calculated results (default view) |
| Advisor | `#advisor` | Architecture recommendations |
| Guide | `#guide` | Sizing concepts reference |

Every view has a **shareable URL**. The `#guide` and `#advisor` links can be shared directly. The **Share URL** button encodes your full configuration in the URL so colleagues can open the exact same sizing.

---

## Input Panels

Each field has a **ⓘ tooltip** — hover it for a concise explanation.

### Data Ingest

| Field | What to enter |
|---|---|
| Daily Ingest Volume | Raw uncompressed data arriving per day across **all** sources, before Elasticsearch indexing |
| Compression Codec | LZ4 for hot tier (fast, ~1.1× ratio); DEFLATE or Best Compression for warm/cold |
| Replica Count | Number of replica shards per primary. Set ≥ 1 for production |
| Number of Indices | Total Elasticsearch indices across all data streams / ILM policies |

> **Tip:** Use the actual raw log volume, not post-compressed size. The tool applies the compression ratio automatically.

### Data Retention

Configure how long data stays in each tier. Set a tier to **0 days** to disable it entirely.

| Field | Guidance |
|---|---|
| ILM Enabled | Leave on unless you manage data movement manually |
| Hot Tier (days) | Keep at 7–14 days for most workloads. Hot nodes use fast SAN storage |
| Warm Tier (days) | 30–90 days is common. Read-only; uses far less memory per TB than hot |
| Cold Tier (days) | Compliance archival with minimal queries. Set 0 to skip |
| Frozen Tier (days) | Searchable snapshots on object storage (PowerScale/ECS). Best cost for long retention |

### Performance

| Field | What to enter |
|---|---|
| Search Rate | Peak search requests per second across the entire cluster |
| Indexing Rate | Peak documents indexed per second |
| Concurrent Searches | Maximum simultaneous search requests |

Performance inputs currently influence ingest/coordinating node recommendations. Future versions will use them for hot-tier data node CPU sizing.

### Deployment

| Field | Options / Notes |
|---|---|
| Deployment Type | **Bare Metal** (recommended for hot tier) or **Virtual Machine** (VMware; applies 22% CPU and 14% storage overhead) |
| Server Model | PowerEdge R760 (2U, data tiers), R660 (1U, infrastructure roles), R7725 (AMD EPYC, maximum memory) |
| CPU Option | Dynamically populated from the selected server's available CPUs. Affects BOM display |
| Memory per Node | RAM installed per data node. Directly controls node count — more RAM = fewer nodes. Capped at server maximum |
| SAN Storage Model | PowerStore model for hot/warm SAN. Larger models cover more raw capacity per unit |
| Frozen Tier Backend | PowerScale (S3-compatible NAS) or ECS (native object storage) |
| Network Speed | 25 GbE is standard. Use 100 GbE for R7725 or very high ingest rates |

### Advanced Settings

| Field | Notes |
|---|---|
| PUE | Power Usage Effectiveness. 1.0 = perfect. Modern datacenters: 1.1–1.3. Legacy: up to 1.8 |
| Carbon Region | Regional carbon intensity (gCO2/kWh) for CO2 calculations |
| Shards per Index | Primary shards per index. Target 10–50 GB per shard |
| Unit System | Binary (GiB/TiB, Elasticsearch-native) or Decimal (GB/TB, vendor specs) |
| Electricity Cost | Local electricity price per kWh (used in 5-year TCO) |
| Project Duration | Years for TCO amortization |

---

## Report View

### Cluster Summary

Top-level KPIs: total nodes, storage, memory, shards, and a shard utilization gauge. Shard utilization above 80% triggers a warning.

### Tier Breakdown

Per-tier table showing node count, memory per node, JVM heap, storage, and shard count for each active tier (hot, warm, cold, frozen). Infrastructure roles (master, ingest, coordinating) are listed separately.

### Sankey Diagram

Visualizes how data flows from daily ingest through compression, replication, and watermark buffering into each tier's storage footprint.

### Hardware BOM

Bill of Materials listing PowerEdge servers (with CPU and RAM configuration), PowerStore SAN units, and PowerScale/ECS object storage nodes. Includes total rack units.

### VM Comparison

Shown only in VM deployment mode. Compares bare metal vs VM node counts and cost, including overhead percentages.

### Sustainability

Annual CO2 emissions, PUE-adjusted energy consumption, annual energy cost, and a 5-year TCO breakdown (hardware + energy + licensing).

---

## Architecture Advisor

The **Advisor** view (`#advisor`) analyses your current configuration in real time:

- **Architecture Pattern** — automatically identifies your topology (Hot-Only, Hot-Warm, Hot-Warm-Cold, Full 4-Tier)
- **Architecture Score** — 0–100 based on detected issues
- **Critical Issues** — must-fix problems (e.g., zero replicas, extreme shard pressure)
- **Warnings** — important concerns (VM overhead, short hot tier, NUMA effects)
- **Optimizations** — cost/performance improvements (enabling frozen tier, reducing cold replicas)
- **Best Practices** — informational guidance (zone awareness for large clusters)
- **Reference Architectures** — comparison of Small/Medium/Large/Enterprise patterns, with your config highlighted

---

## Exports

The **Export** toolbar in the Report view offers three formats:

| Format | Contents |
|---|---|
| PDF | Full report: cluster summary, tier table, hardware BOM, sustainability metrics |
| PPTX | PowerPoint slide deck — ready to embed in proposals |
| YAML | Machine-readable configuration snapshot of all input parameters |

---

## Sharing

- **Share URL** — encodes the full configuration as a compressed URL hash. Send to colleagues to reproduce your exact sizing.
- **Guide Link** — copies a direct link to the guide view (`#guide`).
- **Advisor Link** — accessible at `#advisor` directly.

---

## Language

Select from **English, French, German, or Italian** in the language dropdown in the header. All labels, tooltips, and error messages are translated.

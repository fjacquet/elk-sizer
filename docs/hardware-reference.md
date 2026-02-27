# Dell Hardware Reference

ELK Sizer sizes clusters on Dell PowerEdge servers with PowerStore FC SAN and PowerScale/ECS object storage. This document describes each supported model and the selection logic.

---

## PowerEdge Servers

### PowerEdge R760

| Attribute | Value |
|---|---|
| Form factor | 2U rack |
| Generation | 16G |
| Memory max | 2,048 GB (32 DIMM slots) |
| Drive bays | Up to 16 × 2.5" |
| PCIe slots | 8 |
| Network | 2 × 25GbE SFP28 + 2 × 1GbE RJ45 |
| Power supply | 1,400 W |
| Idle power | 350 W |
| Max power | 1,200 W |
| Recommended for | Hot and warm data tiers |

**CPU options:**

| CPU | Cores | Threads | Base GHz | TDP |
|---|---|---|---|---|
| Intel Xeon Gold 6430 | 32 | 64 | 2.1 | 270 W |
| Intel Xeon Gold 6448Y | 32 | 64 | 2.1 | 225 W |
| Intel Xeon Platinum 8470 | 52 | 104 | 2.0 | 350 W |

---

### PowerEdge R660

| Attribute | Value |
|---|---|
| Form factor | 1U rack |
| Generation | 16G |
| Memory max | 1,024 GB (16 DIMM slots) |
| Drive bays | Up to 10 × 2.5" |
| PCIe slots | 5 |
| Network | 2 × 25GbE SFP28 + 2 × 1GbE RJ45 |
| Power supply | 1,100 W |
| Idle power | 250 W |
| Max power | 900 W |
| Recommended for | Master, ingest, coordinating nodes |

**CPU options:**

| CPU | Cores | Threads | Base GHz | TDP |
|---|---|---|---|---|
| Intel Xeon Gold 6430 | 32 | 64 | 2.1 | 270 W |
| Intel Xeon Silver 4416+ | 20 | 40 | 2.0 | 150 W |

> The R660 is always used for infrastructure roles (master/ingest/coordinating) regardless of the user's server model selection, as 1U density is optimal for these low-storage roles.

---

### PowerEdge R7725

| Attribute | Value |
|---|---|
| Form factor | 2U rack |
| Generation | 16G |
| Memory max | 4,096 GB (24 DIMM slots) |
| Drive bays | Up to 24 × 2.5" or 3.5" |
| PCIe slots | 12 |
| Network | 2 × 100GbE QSFP56 + 2 × 25GbE SFP28 |
| Power supply | 2,400 W |
| Idle power | 500 W |
| Max power | 2,000 W |
| Recommended for | Hot tier, memory-intensive workloads |

**CPU options:**

| CPU | Cores | Threads | Base GHz | TDP |
|---|---|---|---|---|
| AMD EPYC 9554 | 64 | 128 | 3.1 | 360 W |
| AMD EPYC 9354 | 32 | 64 | 3.25 | 280 W |

> Use the R7725 when a single node needs more than 1 TB of RAM or when NUMA-optimized performance is required for very large hot tiers.

---

## Memory per Node Selection

The **Memory per Node** selector in the Deployment panel directly drives the node count calculation:

```
nodeCount = ceil(requiredMemoryGB / memoryPerNode)
```

Higher memory per node → fewer nodes → fewer servers to rack, cable, and license.

**JVM heap is always 50% of RAM, capped at 31 GB** (compressed OOPs threshold):

| RAM per node | JVM heap |
|---|---|
| 64 GB | 31 GB (capped) |
| 128 GB | 31 GB (capped) |
| 256 GB | 31 GB (capped) |
| 512 GB | 31 GB (capped) |

All RAM above 62 GB goes to the **OS page cache**, which Elasticsearch uses heavily for Lucene segment caching. More RAM → larger cache → faster query performance.

---

## PowerStore FC SAN

Used for hot and warm tier data storage.

| Model | Max Effective Capacity | FC Ports | Power |
|---|---|---|---|
| PowerStore 500T | 500 TB | 8 | 1,200 W |
| PowerStore 1200T | 1,200 TB | 8 | 1,500 W |
| PowerStore 3200T | 3,200 TB | 16 | 2,000 W |
| PowerStore 5200T | 5,200 TB | 16 | 2,500 W |
| PowerStore 9200T | 9,200 TB | 32 | 3,500 W |

The hardware engine selects the user-chosen model and calculates how many units are needed to cover total hot + warm storage.

---

## PowerScale Object Storage (Frozen Tier)

Used for frozen tier searchable snapshots via S3-compatible interface.

PowerScale provides a scale-out NAS platform with S3 Object Protocol support. Nodes are selected from the PowerScale catalog based on total cold/frozen storage requirements.

---

## Dell ECS Object Storage (Frozen Tier)

Alternative to PowerScale for frozen tier. Dell ECS (Elastic Cloud Storage) is a purpose-built object storage platform with a native S3-compatible API.

ECS sizing is estimated at **500 TB effective capacity per node** with 800 W power draw per node.

---

## Network Connectivity

| Component | Detail |
|---|---|
| Server ↔ TOR switch | 25 GbE (standard) or 100 GbE (R7725 / high ingest) |
| TOR switch count | `max(2, ceil(totalEthPorts / 48))` |
| Server ↔ PowerStore | 32Gb Fibre Channel |
| FC ports | Derived from PowerStore model × unit count |

Two Ethernet paths per server are counted for HA (active/active bonding or ECMP).

---

## Server Role Assignment

| Elasticsearch Role | Assigned Server | Rationale |
|---|---|---|
| `data_hot` | User selected (default R760) | High storage and memory density |
| `data_warm` | User selected (default R760) | Same platform, lower memory ratio |
| `data_cold` | User selected (falls back to warm server) | Minimal resources needed |
| `data_frozen` | User selected (falls back to warm server) | Hosts searchable snapshot cache only |
| `master` | R660 | 1U density; no storage requirement |
| `ingest` | R660 | 1U density; CPU-bound pipeline processing |
| `coordinating` | R660 | 1U density; memory-bound aggregation |

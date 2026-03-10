import PptxGenJS from 'pptxgenjs'
import { toast } from 'sonner'
import type { CalculationResults } from '@/types/results'

const BRAND_GREEN = '228B22'
const DARK_BG = '1E293B'
const LIGHT_TEXT = 'E2E8F0'
const MUTED_TEXT = '94A3B8'

export function exportPPTX(results: CalculationResults, title: string): void {
  try {
    const pptx = new PptxGenJS()
    pptx.layout = 'LAYOUT_16x9'
    pptx.author = 'ELK Sizer'
    pptx.title = title

    // Slide 1 — Title
    const slide1 = pptx.addSlide()
    slide1.background = { color: DARK_BG }
    slide1.addText(title, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 1.5,
      fontSize: 32,
      bold: true,
      color: LIGHT_TEXT,
    })
    slide1.addText(`Generated: ${new Date().toISOString().split('T')[0]}`, {
      x: 0.5,
      y: 3.2,
      w: 9,
      fontSize: 14,
      color: MUTED_TEXT,
    })

    // Slide 2 — Cluster Summary
    const slide2 = pptx.addSlide()
    slide2.background = { color: DARK_BG }
    slide2.addText('Cluster Summary', {
      x: 0.5,
      y: 0.3,
      w: 9,
      fontSize: 24,
      bold: true,
      color: LIGHT_TEXT,
    })
    slide2.addTable(
      [
        [
          {
            text: 'Metric',
            options: { bold: true, color: LIGHT_TEXT, fill: { color: BRAND_GREEN } },
          },
          {
            text: 'Value',
            options: { bold: true, color: LIGHT_TEXT, fill: { color: BRAND_GREEN } },
          },
        ],
        [{ text: 'Total Nodes' }, { text: String(results.cluster.totalNodes) }],
        [{ text: 'Total Storage (TB)' }, { text: results.cluster.totalStorageTB.toFixed(2) }],
        [{ text: 'Total Memory (TB)' }, { text: results.cluster.totalMemoryTB.toFixed(2) }],
        [{ text: 'Total Shards' }, { text: String(results.cluster.totalShards) }],
        [
          { text: 'Estimated Cost (USD)' },
          { text: `$${results.hardware.estimatedCostUSD.toLocaleString()}` },
        ],
      ],
      {
        x: 0.5,
        y: 1.2,
        w: 9,
        fontSize: 12,
        color: LIGHT_TEXT,
        border: { type: 'solid', pt: 0.5, color: '475569' },
        rowH: 0.45,
      },
    )

    // Slide 3 — Tier Breakdown
    const slide3 = pptx.addSlide()
    slide3.background = { color: DARK_BG }
    slide3.addText('Tier Breakdown', {
      x: 0.5,
      y: 0.3,
      w: 9,
      fontSize: 24,
      bold: true,
      color: LIGHT_TEXT,
    })
    const activeTiers = results.cluster.tiers.filter((t) => t.nodeCount > 0)
    slide3.addTable(
      [
        [
          {
            text: 'Tier',
            options: { bold: true, color: LIGHT_TEXT, fill: { color: BRAND_GREEN } },
          },
          {
            text: 'Nodes',
            options: { bold: true, color: LIGHT_TEXT, fill: { color: BRAND_GREEN } },
          },
          {
            text: 'Storage (GB)',
            options: { bold: true, color: LIGHT_TEXT, fill: { color: BRAND_GREEN } },
          },
          {
            text: 'Memory (GB)',
            options: { bold: true, color: LIGHT_TEXT, fill: { color: BRAND_GREEN } },
          },
          {
            text: 'JVM Heap (GB)',
            options: { bold: true, color: LIGHT_TEXT, fill: { color: BRAND_GREEN } },
          },
          {
            text: 'Shards',
            options: { bold: true, color: LIGHT_TEXT, fill: { color: BRAND_GREEN } },
          },
        ],
        ...activeTiers.map((t) => [
          { text: t.tier.toUpperCase() },
          { text: String(t.nodeCount) },
          { text: t.storageGB.toFixed(0) },
          { text: String(t.memoryPerNodeGB) },
          { text: String(t.jvmHeapGB) },
          { text: String(t.shardCount) },
        ]),
      ],
      {
        x: 0.5,
        y: 1.2,
        w: 9,
        fontSize: 11,
        color: LIGHT_TEXT,
        border: { type: 'solid', pt: 0.5, color: '475569' },
        rowH: 0.4,
      },
    )

    // Slide 4 — Hardware BOM
    const slide4 = pptx.addSlide()
    slide4.background = { color: DARK_BG }
    slide4.addText('Hardware Bill of Materials', {
      x: 0.5,
      y: 0.3,
      w: 9,
      fontSize: 24,
      bold: true,
      color: LIGHT_TEXT,
    })
    slide4.addTable(
      [
        [
          {
            text: 'Model',
            options: { bold: true, color: LIGHT_TEXT, fill: { color: BRAND_GREEN } },
          },
          {
            text: 'Role',
            options: { bold: true, color: LIGHT_TEXT, fill: { color: BRAND_GREEN } },
          },
          { text: 'Qty', options: { bold: true, color: LIGHT_TEXT, fill: { color: BRAND_GREEN } } },
          { text: 'CPU', options: { bold: true, color: LIGHT_TEXT, fill: { color: BRAND_GREEN } } },
          {
            text: 'RAM (GB)',
            options: { bold: true, color: LIGHT_TEXT, fill: { color: BRAND_GREEN } },
          },
        ],
        ...results.hardware.bom.servers.map((s) => [
          { text: s.model },
          { text: s.role },
          { text: String(s.count) },
          { text: s.config.cpu.model },
          { text: String(s.config.memoryGB) },
        ]),
      ],
      {
        x: 0.5,
        y: 1.2,
        w: 9,
        fontSize: 11,
        color: LIGHT_TEXT,
        border: { type: 'solid', pt: 0.5, color: '475569' },
        rowH: 0.4,
      },
    )

    // Slide 5 — Sustainability
    const slide5 = pptx.addSlide()
    slide5.background = { color: DARK_BG }
    slide5.addText('Sustainability & TCO', {
      x: 0.5,
      y: 0.3,
      w: 9,
      fontSize: 24,
      bold: true,
      color: LIGHT_TEXT,
    })
    slide5.addTable(
      [
        [
          {
            text: 'Metric',
            options: { bold: true, color: LIGHT_TEXT, fill: { color: BRAND_GREEN } },
          },
          {
            text: 'Value',
            options: { bold: true, color: LIGHT_TEXT, fill: { color: BRAND_GREEN } },
          },
        ],
        [
          { text: 'Total Power (kW)' },
          { text: (results.sustainability.pueAdjustedPowerWatts / 1000).toFixed(1) },
        ],
        [
          { text: 'Annual Energy (MWh)' },
          { text: (results.sustainability.annualEnergyKWh / 1000).toFixed(1) },
        ],
        [
          { text: 'Annual CO2 (t)' },
          { text: (results.sustainability.annualCO2Kg / 1000).toFixed(1) },
        ],
        [
          { text: 'Total Cost of Ownership' },
          { text: `$${results.sustainability.totalTCO.toLocaleString()}` },
        ],
      ],
      {
        x: 0.5,
        y: 1.2,
        w: 9,
        fontSize: 12,
        color: LIGHT_TEXT,
        border: { type: 'solid', pt: 0.5, color: '475569' },
        rowH: 0.45,
      },
    )

    pptx.writeFile({ fileName: 'elk-sizer-report.pptx' })
  } catch (error) {
    console.error('PPTX export failed:', error)
    toast.error('PowerPoint export failed', {
      description: 'An error occurred while generating the PPTX report.',
    })
  }
}

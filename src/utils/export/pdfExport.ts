import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { CalculationResults } from '@/types/results'

export function exportPDF(results: CalculationResults, title: string): void {
  const doc = new jsPDF()

  // Title
  doc.setFontSize(18)
  doc.text(title, 14, 22)

  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toISOString().split('T')[0]}`, 14, 30)

  // Cluster Summary
  doc.setFontSize(14)
  doc.text('Cluster Summary', 14, 42)

  autoTable(doc, {
    startY: 46,
    head: [['Metric', 'Value']],
    body: [
      ['Total Nodes', String(results.cluster.totalNodes)],
      ['Total Storage (TB)', results.cluster.totalStorageTB.toFixed(2)],
      ['Total Memory (TB)', results.cluster.totalMemoryTB.toFixed(2)],
      ['Total Shards', String(results.cluster.totalShards)],
      ['Estimated Cost (USD)', `$${results.hardware.estimatedCostUSD.toLocaleString()}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [34, 139, 34] },
  })

  // Tier Breakdown
  const tierY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  doc.setFontSize(14)
  doc.text('Tier Breakdown', 14, tierY)

  const activeTiers = results.cluster.tiers.filter((t) => t.nodeCount > 0)
  autoTable(doc, {
    startY: tierY + 4,
    head: [['Tier', 'Nodes', 'Storage (GB)', 'Memory (GB/node)', 'JVM Heap (GB)', 'Shards']],
    body: activeTiers.map((t) => [
      t.tier.toUpperCase(),
      String(t.nodeCount),
      t.storageGB.toFixed(0),
      String(t.memoryPerNodeGB),
      String(t.jvmHeapGB),
      String(t.shardCount),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [34, 139, 34] },
  })

  // Hardware BOM
  const bomY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  doc.setFontSize(14)
  doc.text('Hardware Bill of Materials', 14, bomY)

  autoTable(doc, {
    startY: bomY + 4,
    head: [['Model', 'Role', 'Qty', 'CPU', 'RAM (GB)']],
    body: results.hardware.bom.servers.map((s) => [
      s.model,
      s.role,
      String(s.count),
      s.config.cpu.model,
      String(s.config.memoryGB),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [34, 139, 34] },
  })

  // Sustainability
  const susY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  if (susY < 250) {
    doc.setFontSize(14)
    doc.text('Sustainability & TCO', 14, susY)

    autoTable(doc, {
      startY: susY + 4,
      head: [['Metric', 'Value']],
      body: [
        ['Total Power (kW)', (results.sustainability.pueAdjustedPowerWatts / 1000).toFixed(1)],
        ['Annual Energy (MWh)', (results.sustainability.annualEnergyKWh / 1000).toFixed(1)],
        ['Annual CO2 (t)', (results.sustainability.annualCO2Kg / 1000).toFixed(1)],
        ['TCO', `$${results.sustainability.totalTCO.toLocaleString()}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [34, 139, 34] },
    })
  }

  doc.save('elk-sizer-report.pdf')
}

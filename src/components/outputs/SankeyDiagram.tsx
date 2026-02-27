import { sankey as d3Sankey, sankeyLinkHorizontal } from 'd3-sankey'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { CalculationResults } from '@/types/results'

interface Props {
  results: CalculationResults
}

interface NodeDatum {
  id: string
  name: string
}

interface SankeyLinkDatum {
  source: number
  target: number
  value: number
}

const TIER_COLORS: Record<string, string> = {
  'Raw Ingest': '#94a3b8',
  Compression: '#a78bfa',
  Hot: '#f97316',
  Warm: '#eab308',
  Cold: '#3b82f6',
  Frozen: '#8b5cf6',
}

export function SankeyDiagram({ results }: Props) {
  const { t } = useTranslation('output')
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const width = svg.clientWidth || 600
    const height = 300

    const tierData = results.storage.perTier.filter((tier) => tier.retentionDays > 0)

    const nodes: NodeDatum[] = [
      { id: 'ingest', name: 'Raw Ingest' },
      { id: 'compressed', name: 'Compression' },
      ...tierData.map((tier) => ({
        id: tier.tier,
        name: tier.tier.charAt(0).toUpperCase() + tier.tier.slice(1),
      })),
    ]

    const totalDaily = results.storage.perTier[0]?.dailyIngestGB ?? 100

    const nodeMap = new Map(nodes.map((n, i) => [n.id, i]))
    const sankeyLinks: SankeyLinkDatum[] = [
      {
        source: nodeMap.get('ingest') ?? 0,
        target: nodeMap.get('compressed') ?? 1,
        value: totalDaily,
      },
      ...tierData.map((tier) => ({
        source: nodeMap.get('compressed') ?? 1,
        target: nodeMap.get(tier.tier) ?? 2,
        value: Math.max(tier.watermarkBufferedGB / Math.max(tier.retentionDays, 1), 1),
      })),
    ]

    const sankeyGen = d3Sankey<NodeDatum, SankeyLinkDatum>()
      .nodeWidth(20)
      .nodePadding(20)
      .extent([
        [10, 10],
        [width - 10, height - 10],
      ])

    const sankeyNodes = nodes.map((n) => ({ ...n }))

    const graph = sankeyGen({
      nodes: sankeyNodes,
      links: sankeyLinks,
    })

    // Clear and draw
    while (svg.firstChild) svg.removeChild(svg.firstChild)
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)

    // Draw links
    const linkPath = sankeyLinkHorizontal()
    for (const link of graph.links) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      const d = linkPath(link as never)
      if (d) path.setAttribute('d', d)
      path.setAttribute('class', 'sankey-link')
      const linkWidth = (link as unknown as { width: number }).width
      path.setAttribute('stroke-width', String(Math.max(linkWidth ?? 1, 1)))
      const targetNode = link.target as unknown as NodeDatum
      const color = TIER_COLORS[targetNode.name ?? ''] ?? '#64748b'
      path.setAttribute('stroke', color)
      svg.appendChild(path)
    }

    // Draw nodes
    for (const node of graph.nodes) {
      const n = node as unknown as NodeDatum & {
        x0: number
        x1: number
        y0: number
        y1: number
      }
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.setAttribute('x', String(n.x0))
      rect.setAttribute('y', String(n.y0))
      rect.setAttribute('width', String(n.x1 - n.x0))
      rect.setAttribute('height', String(Math.max(n.y1 - n.y0, 1)))
      const color = TIER_COLORS[n.name] ?? '#64748b'
      rect.setAttribute('fill', color)
      svg.appendChild(rect)

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('x', String(n.x1 + 6))
      text.setAttribute('y', String((n.y0 + n.y1) / 2))
      text.setAttribute('dy', '0.35em')
      text.setAttribute('fill', '#94a3b8')
      text.setAttribute('font-size', '11')
      text.textContent = n.name
      svg.appendChild(text)
    }
  }, [results])

  return (
    <div className="panel">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        {t('sankey.title')}
      </h3>
      <svg ref={svgRef} className="w-full" style={{ height: 300 }} />
    </div>
  )
}

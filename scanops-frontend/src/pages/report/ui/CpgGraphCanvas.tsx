import { useEffect, useMemo, useRef, useState } from 'react'
import cytoscape, { type Core, type StylesheetJson } from 'cytoscape'
import { useTranslation } from 'react-i18next'
import type { CpgGraph } from '../../../shared/lib/cpgGraph'

type Layer = 'REACHING_DEF' | 'CFG' | 'AST' | 'all'
// Code-native network icon, bundled locally; no external image requests.
const networkIcon =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><g stroke="#1689d5" stroke-width="2.5" fill="none"><path d="M24 24 13 13M24 24 35 15M24 24 12 33M24 24 34 35"/></g><g fill="#1689d5"><circle cx="24" cy="24" r="5"/><circle cx="13" cy="13" r="3.5"/><circle cx="35" cy="15" r="3.5"/><circle cx="12" cy="33" r="3.5"/><circle cx="34" cy="35" r="3.5"/></g></svg>`
  )
function callName(code: string): string {
  let depth = 0
  let name = code
  for (let i = 0; i < code.length; i++) {
    if (code[i] === '(') {
      if (depth === 0) name = code.slice(0, i).match(/[\w$<>]+$/)?.[0] ?? name
      depth++
    } else if (code[i] === ')') depth = Math.max(0, depth - 1)
  }
  return name
}

const style: StylesheetJson = [
  {
    selector: 'node',
    style: {
      label: 'data(caption)',
      shape: 'ellipse',
      width: 48,
      height: 48,
      'background-color': '#a1d5f5',
      'background-image': networkIcon,
      'background-width': '85%',
      'background-height': '85%',
      'border-color': '#ffffff',
      'border-width': 2,
      color: '#ffffff',
      'font-size': 11,
      'font-family': 'system-ui, sans-serif',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'text-margin-y': 6,
      'text-background-color': '#414c5a',
      'text-background-opacity': 1,
      'text-background-padding': '4px',
      'text-background-shape': 'roundrectangle',
      'overlay-opacity': 0,
    },
  },
  {
    selector: 'node[role = "source"]',
    style: {
      'background-color': '#71baf5',
      'border-color': '#3182f6',
      'border-width': 3,
      'text-background-color': '#246bd1',
    },
  },
  {
    selector: 'node[role = "sink"]',
    style: {
      'background-color': '#ffd3d8',
      'border-color': '#ef8294',
      'border-width': 3,
      'text-background-color': '#ae5265',
    },
  },
  {
    selector: 'node:selected',
    style: {
      'border-width': 4,
      'border-color': '#1b64da',
      'underlay-color': '#3182f6',
      'underlay-opacity': 0.12,
      'underlay-padding': 9,
      'underlay-shape': 'ellipse',
    },
  },
  {
    selector: 'edge',
    style: {
      width: 1.8,
      'curve-style': 'bezier',
      'control-point-step-size': 45,
      'target-arrow-shape': 'triangle',
      'arrow-scale': 1.1,
      'line-color': '#b0bac6',
      'target-arrow-color': '#b0bac6',
      label: 'data(caption)',
      'font-size': 9,
      color: '#ffffff',
      'text-background-color': '#597fa8',
      'text-background-opacity': 0.97,
      'text-background-padding': '3px',
      'text-background-shape': 'roundrectangle',
      'text-rotation': 'autorotate',
    },
  },
  { selector: 'edge[kind = "CFG"]', style: { 'text-background-color': '#86739e' } },
  { selector: 'edge[kind = "AST"]', style: { 'text-background-color': '#788594' } },
  { selector: '.unfocused', style: { opacity: 0.22 } },
]

export default function CpgGraphCanvas({
  graph,
  selectedId,
  onSelect,
}: {
  graph: CpgGraph
  selectedId: string
  onSelect: (id: string) => void
}) {
  const { t } = useTranslation('report')
  const container = useRef<HTMLDivElement>(null)
  const cyRef = useRef<Core | null>(null)
  const [layer, setLayer] = useState<Layer>('all')
  const [context, setContext] = useState(true)
  const [error, setError] = useState(false)
  const visible = useMemo(() => {
    const nodes = graph.nodes.filter(
      (n) => graph.version === 1 || context || n.onPath || n.role !== 'intermediate'
    )
    const ids = new Set(nodes.map((n) => n.id))
    const edges = graph.edges.filter(
      (e) =>
        ids.has(e.source) &&
        ids.has(e.target) &&
        (graph.version === 1 || layer === 'all' || e.kind === layer)
    )
    const connected = new Set(edges.flatMap((e) => [e.source, e.target]))
    return {
      nodes: nodes.filter(
        (n) => !context || connected.has(n.id) || n.onPath || n.role !== 'intermediate'
      ),
      edges,
    }
  }, [graph, layer, context])

  useEffect(() => {
    if (!container.current) return
    let cy: Core | undefined
    let observer: ResizeObserver | undefined
    try {
      const layout = {
        name: 'cose' as const,
        animate: false,
        randomize: false,
        nodeRepulsion: () => 18000,
        idealEdgeLength: () => 145,
        edgeElasticity: () => 100,
        gravity: 0.15,
        numIter: 1400,
        padding: 55,
        componentSpacing: 100,
        nodeDimensionsIncludeLabels: true,
      }
      cy = cytoscape({
        container: container.current,
        elements: [
          ...visible.nodes.map((n, index) => ({
            position: {
              x: 250 * Math.cos((index * Math.PI * 2) / visible.nodes.length),
              y: 250 * Math.sin((index * Math.PI * 2) / visible.nodes.length),
            },
            data: {
              id: n.id,
              role: n.role,
              caption: `${(n.label === 'CALL' ? callName(n.code) : ['METHOD', 'BLOCK', 'METHOD_RETURN', 'METHOD_PARAMETER_IN', 'METHOD_PARAMETER_OUT'].includes(n.label ?? '') ? t(`vuln.cpg.nodeTypes.${n.label}`) : n.code).slice(0, 18)} · ${n.line}`,
            },
          })),
          ...visible.edges.map((e, i) => ({
            data: {
              id: `edge-${i}`,
              source: e.source,
              target: e.target,
              kind: e.kind ?? 'path',
              caption: t(`vuln.cpg.edges.${e.kind ?? 'path'}`),
            },
          })),
        ],
        style,
        minZoom: 0.15,
        maxZoom: 2.5,
        userZoomingEnabled: false,
        layout,
      })
      cyRef.current = cy
      cy.on('tap', 'node', (event) => onSelect(event.target.id()))
      cy.on('mouseover', 'node', (event) => {
        cy?.elements().difference(event.target.closedNeighborhood()).addClass('unfocused')
      })
      cy.on('mouseout dragfree', 'node', () => cy?.elements().removeClass('unfocused'))
      // Prevent a tiny graph from being blown up to fill the entire panel.
      const fit = () => {
        cy?.resize()
        cy?.fit(undefined, 45)
        if (cy && cy.zoom() > 1.1) {
          cy.zoom(1.1)
          cy.center()
        }
      }
      fit()
      observer = new ResizeObserver(fit)
      observer.observe(container.current)
    } catch {
      // External canvas initialization can fail (e.g. unavailable rendering context).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(true)
    }
    return () => {
      observer?.disconnect()
      cy?.destroy()
      cyRef.current = null
    }
  }, [visible, onSelect, t])

  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    cy.nodes().unselect()
    cy.getElementById(selectedId).select()
  }, [selectedId, visible])

  const button =
    'rounded-lg border border-line bg-white px-3 py-2 text-[12px] font-medium text-ink-sub hover:border-brand hover:text-brand focus-visible:outline-brand'
  return (
    <div className="rounded-xl border border-line overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-3 bg-white">
        {graph.version === 2 && (
          <div className="flex flex-wrap gap-1" role="group" aria-label={t('vuln.cpg.layers')}>
            {(['REACHING_DEF', 'CFG', 'AST', 'all'] as const).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={layer === value}
                onClick={() => setLayer(value)}
                className={`${button} ${layer === value ? '!bg-brand-soft !border-brand/30 !text-brand-press' : ''}`}
              >
                {t(`vuln.cpg.edges.${value}`)}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-1">
          <button
            type="button"
            className={button}
            aria-label={t('vuln.cpg.zoomOut')}
            onClick={() => cyRef.current?.zoom(cyRef.current.zoom() / 1.25)}
          >
            −
          </button>
          <button
            type="button"
            className={button}
            aria-label={t('vuln.cpg.zoomIn')}
            onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.25)}
          >
            ＋
          </button>
          <button
            type="button"
            className={button}
            onClick={() => {
              const cy = cyRef.current
              cy?.elements().removeClass('unfocused')
              cy?.fit(undefined, 45)
              if (cy && cy.zoom() > 1.1) {
                cy.zoom(1.1)
                cy.center()
              }
            }}
          >
            {t('vuln.cpg.fit')}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap justify-between gap-3 px-4 py-3 text-[12px] bg-surface text-ink-sub">
        <span>
          {t('vuln.cpg.counts', { nodes: visible.nodes.length, edges: visible.edges.length })}
        </span>
        {graph.version === 2 && (
          <label className="flex gap-2 items-center cursor-pointer">
            <input
              type="checkbox"
              checked={context}
              onChange={(e) => setContext(e.target.checked)}
              className="accent-brand"
            />
            {t('vuln.cpg.context')}
          </label>
        )}
      </div>
      {error ? (
        <p className="p-5 text-ink-sub">{t('vuln.cpg.error')}</p>
      ) : (
        <div
          ref={container}
          className="h-[480px] sm:h-[560px] w-full bg-white"
          role="img"
          aria-label={t('vuln.cpg.graphDescription')}
        />
      )}
      {!visible.edges.length && (
        <p className="px-4 py-2 text-[12px] text-ink-sub">{t('vuln.cpg.noEdges')}</p>
      )}
      <div className="border-t border-line px-4 py-3 bg-white space-y-2">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-ink-sub">
          <span className="flex items-center gap-2">
            <i className="w-3 h-3 rounded-full bg-brand" />
            {t('vuln.cpg.source')}
          </span>
          <span className="flex items-center gap-2">
            <i className="w-3 h-3 rounded-full bg-rose-400" />
            {t('vuln.cpg.sink')}
          </span>
          <span>{t('vuln.cpg.interaction')}</span>
        </div>
        <label className="flex items-center gap-3 text-[12px] text-ink-sub">
          {t('vuln.cpg.selectNode')}
          <select
            className="min-w-0 max-w-full rounded border border-line bg-white p-2 text-ink"
            value={visible.nodes.some((n) => n.id === selectedId) ? selectedId : ''}
            onChange={(e) => onSelect(e.target.value)}
          >
            <option value="" disabled>
              {t('vuln.cpg.selectNode')}
            </option>
            {visible.nodes.map((n) => (
              <option key={n.id} value={n.id}>
                L{n.line} · {n.code.slice(0, 80)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}

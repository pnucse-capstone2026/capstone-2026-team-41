export interface CpgNode {
  id: string
  role: 'source' | 'intermediate' | 'sink'
  file: string
  line: number
  code: string
  excerpt?: { code: string; startLine: number; targetLine: number } | null
}
export interface CpgGraph {
  version: 1
  kind: 'data-flow' | 'call-site' | 'partial-flow'
  nodes: CpgNode[]
  edges: { source: string; target: string }[]
}

/** Do not render unknown graph contracts or make up missing edges. */
export function parseCpgGraph(raw: unknown): CpgGraph | undefined {
  if (typeof raw !== 'string') return undefined
  try {
    const g = JSON.parse(raw)
    if (
      g?.version !== 1 ||
      !['data-flow', 'call-site', 'partial-flow'].includes(g.kind) ||
      !Array.isArray(g.nodes) ||
      !g.nodes.length ||
      g.nodes.length > 256 ||
      !Array.isArray(g.edges)
    )
      return undefined
    const ids = new Set<string>()
    for (const n of g.nodes) {
      if (
        !n ||
        typeof n.id !== 'string' ||
        ids.has(n.id) ||
        !['source', 'intermediate', 'sink'].includes(n.role) ||
        typeof n.file !== 'string' ||
        typeof n.code !== 'string' ||
        !Number.isInteger(n.line) ||
        n.line <= 0
      )
        return undefined
      ids.add(n.id)
      if (
        n.excerpt != null &&
        (typeof n.excerpt.code !== 'string' ||
          !Number.isInteger(n.excerpt.startLine) ||
          n.excerpt.startLine <= 0 ||
          n.excerpt.targetLine !== n.line ||
          n.excerpt.startLine > n.line ||
          n.line >= n.excerpt.startLine + n.excerpt.code.split('\n').length)
      )
        return undefined
    }
    if (
      g.edges.length !== g.nodes.length - 1 ||
      g.edges.some(
        (e: { source: string; target: string }, i: number) =>
          !e || e.source !== g.nodes[i].id || e.target !== g.nodes[i + 1].id
      )
    )
      return undefined
    if (
      g.kind === 'data-flow' &&
      (g.nodes.length < 2 || g.nodes[0].role !== 'source' || g.nodes.at(-1).role !== 'sink')
    )
      return undefined
    if (g.kind === 'call-site' && (g.nodes.length !== 1 || g.nodes[0].role !== 'sink'))
      return undefined
    return g as CpgGraph
  } catch {
    return undefined
  }
}

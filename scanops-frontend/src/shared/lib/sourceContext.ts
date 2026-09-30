export interface SourceContext {
  code: string
  startLine: number
  targetLine: number
  path: string
  origin: 'scan' | 'repository'
}

export function githubSourceLocation(location: string) {
  try {
    const url = new URL(location.split(' → ')[0])
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'github.com' ||
      url.username ||
      url.password ||
      url.port
    )
      return null
    const match = url.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/)
    const targetLine = Number(url.hash.match(/^#L(\d+)(?:-L\d+)?$/)?.[1])
    if (!match || !Number.isSafeInteger(targetLine) || targetLine < 1) return null
    const [, owner, repo, ref, path] = match
    return {
      rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`,
      targetLine,
      path: decodeURIComponent(path),
      reference: url.href,
    }
  } catch {
    return null
  }
}

export function excerptAround(
  source: string,
  targetLine: number,
  path: string
): SourceContext | null {
  const lines = source.replace(/\r?\n$/, '').split(/\r?\n/)
  if (!source || !Number.isSafeInteger(targetLine) || targetLine < 1 || targetLine > lines.length)
    return null
  const startLine = Math.max(1, targetLine - 5)
  return {
    code: lines.slice(startLine - 1, targetLine + 5).join('\n'),
    startLine,
    targetLine,
    path,
    origin: 'repository',
  }
}

/** Legacy public reports only. Never forwards ScanOps credentials to GitHub. */
export async function fetchSourceContext(
  location: string,
  signal: AbortSignal
): Promise<SourceContext | null> {
  const parsed = githubSourceLocation(location)
  if (!parsed) return null
  const response = await fetch(parsed.rawUrl, {
    signal,
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  })
  if (!response.ok) throw new Error('Source unavailable')
  if (Number(response.headers.get('content-length')) > 2_000_000)
    throw new Error('Source too large')
  const source = await response.text()
  if (source.length > 2_000_000) throw new Error('Source too large')
  return excerptAround(source, parsed.targetLine, parsed.path)
}

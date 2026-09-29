const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('scanops.token')
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  })
  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`
    try {
      const body = await res.json()
      if (body?.error) errorMsg = body.error
    } catch { /* ignore parse errors */ }
    throw new Error(errorMsg)
  }
  // 204 No Content(삭제 등)나 빈 본문이면 파싱하지 않는다.
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

import axios from 'axios'
import type { Scan, Vulnerability, StartScanRequest, StartScanResponse } from '../types/scan'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
})

export const getScans = (): Promise<Scan[]> =>
  api.get<Scan[]>('/api/scans').then((r) => r.data)

export const startScan = (payload: StartScanRequest): Promise<StartScanResponse> =>
  api.post<StartScanResponse>('/api/scans', payload).then((r) => r.data)

export const getScan = (id: string): Promise<Scan> =>
  api.get<Scan>(`/api/scans/${id}`).then((r) => r.data)

export const getVulnerabilities = (id: string): Promise<Vulnerability[]> =>
  api.get<Vulnerability[]>(`/api/scans/${id}/vulnerabilities`).then((r) => r.data)

export interface VulnMeta {
  summary: string | null
  description: string | null
  solution: string | null
}

export const generateVulnMeta = (vulnId: string): Promise<VulnMeta> =>
  api.post<VulnMeta>(`/api/vulnerabilities/${vulnId}/meta`).then((r) => r.data)

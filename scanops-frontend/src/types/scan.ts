export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL'
export type ScanStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'
export type ScanMode = 'WEBSITE' | 'GITHUB_REPO'

export interface Scan {
  id: string
  targetUrl: string
  ownerEmail: string
  status: ScanStatus
  scanMode: ScanMode
  verified: boolean
  createdAt: string
  finishedAt?: string
}

export interface Vulnerability {
  id: string
  jobId: string
  vulnType: string
  url: string
  parameter: string
  riskLevel: RiskLevel
  cvssScore: number
  cvssVector: string
  summary: string | null
  description: string | null
  solution: string | null
  aiAnalysis: string | null
  aiModel: string | null
  createdAt: string
}

export interface StartScanRequest {
  targetUrl: string
  ownerEmail: string
  scanMode: ScanMode
}

export interface StartScanResponse {
  id: string
}

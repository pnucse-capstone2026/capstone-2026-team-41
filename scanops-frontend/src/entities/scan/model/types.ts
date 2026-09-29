export type ScanStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'
export type ScanMode = 'WEBSITE' | 'GITHUB_REPO'

export interface ScanJob {
  id: string
  targetUrl: string
  status: ScanStatus
  scanMode: ScanMode
  ownerEmail: string
  verified: boolean
  createdAt: string
  finishedAt?: string
}

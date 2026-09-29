import { http } from '../../../shared/api/httpClient'
import type { ScanJob } from '../../../entities/scan/model/types'

export type ScanMode = 'WEBSITE' | 'GITHUB_REPO'

interface StartScanParams {
  targetUrl: string
  ownerEmail: string
  scanMode: ScanMode
}

export const startScan = (params: StartScanParams) =>
  http<ScanJob>('/api/scans', {
    method: 'POST',
    body: JSON.stringify(params),
  })

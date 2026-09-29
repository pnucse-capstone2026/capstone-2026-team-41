import { http } from '../../../shared/api/httpClient'
import type { ScanJob } from '../model/types'

export const getScanJob = (id: string) => http<ScanJob>(`/api/scans/${id}`)

export const listReports = () => http<ScanJob[]>('/api/scans')

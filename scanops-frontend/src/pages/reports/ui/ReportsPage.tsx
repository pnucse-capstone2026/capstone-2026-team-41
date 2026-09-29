import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AppNav from '../../../shared/ui/AppNav'
import Card from '../../../shared/ui/Card'
import Badge from '../../../shared/ui/Badge'
import Button from '../../../shared/ui/Button'
import Icon from '../../../shared/ui/Icon'
import Modal from '../../../shared/ui/Modal'
import Segmented from '../../../shared/ui/Segmented'
import { useToast } from '../../../shared/ui/Toast'
import { MODE_META, formatDateTime, type ScanSummary, type ScanStatus, type ScanMode } from '../../../shared/lib/mock'
import { fetchScansPage, deleteScan, type ScanPage } from '../../../shared/api/scan'

type Filter = 'ALL' | ScanMode
const PAGE_SIZE = 10

const STATUS: Record<ScanStatus, { key: string; tone: 'success' | 'brand' | 'warning' | 'danger' }> = {
  DONE: { key: 'done', tone: 'success' },
  RUNNING: { key: 'running', tone: 'brand' },
  PENDING: { key: 'pending', tone: 'warning' },
  FAILED: { key: 'failed', tone: 'danger' },
}

export default function ReportsPage() {
  const { t } = useTranslation('reports')
  const navigate = useNavigate()
  const { toast } = useToast()

  const [page, setPage] = useState(0)        // 0-based
  const [filter, setFilter] = useState<Filter>('ALL')
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')

  const [data, setData] = useState<ScanPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [target, setTarget] = useState<ScanSummary | null>(null) // 삭제 확인 대상
  const [deleting, setDeleting] = useState(false)

  // 검색어 디바운스
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  // 필터/검색어가 바뀌면 첫 페이지로
  useEffect(() => { setPage(0) }, [filter, debouncedQ])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchScansPage({ page, size: PAGE_SIZE, mode: filter, q: debouncedQ })
      setData(res)
    } catch {
      setError(t('list.loadError'))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [page, filter, debouncedQ])

  useEffect(() => { load() }, [load])

  const confirmDelete = async () => {
    if (!target) return
    setDeleting(true)
    try {
      await deleteScan(target.id)
      toast(t('toast.deleteSuccess'), 'success')
      setTarget(null)
      // 마지막 항목을 지워 페이지가 비고, 첫 페이지가 아니면 한 칸 뒤로
      if (data && data.items.length === 1 && page > 0) setPage((p) => p - 1)
      else load()
    } catch {
      toast(t('toast.deleteFail'), 'danger')
    } finally {
      setDeleting(false)
    }
  }

  const items = data?.items ?? []
  const total = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="min-h-screen bg-surface">
      <AppNav />
      <main className="max-w-[920px] mx-auto px-6 py-8 fade-up">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-[26px] font-bold text-ink tracking-tight">{t('page.title')}</h1>
            <p className="mt-1 text-sm text-ink-muted">{t('page.subtitle')}</p>
          </div>
          <Button variant="outline" size="sm" leftIcon="plus" onClick={() => navigate('/scan')}>{t('page.newScan')}</Button>
        </div>

        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'ALL', label: t('filter.all') },
              { value: 'WEBSITE', label: 'DAST' },
              { value: 'GITHUB_REPO', label: 'SAST' },
            ]}
          />
          <div className="relative flex-1 min-w-[180px] max-w-[280px]">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"><Icon name="search" size={17} /></span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search.placeholder')}
              className="w-full h-10 rounded-xl bg-white border border-line pl-10 pr-3 text-[14px] text-ink placeholder:text-ink-faint outline-none focus:border-brand transition-colors" />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2.5">{[0, 1, 2, 3].map((i) => <div key={i} className="h-[72px] rounded-2xl skeleton" />)}</div>
        ) : error ? (
          <Card pad="lg" className="text-center py-16">
            <span className="inline-flex w-14 h-14 rounded-2xl bg-danger-soft text-danger items-center justify-center mb-3"><Icon name="alert-triangle" size={26} /></span>
            <p className="text-sm text-ink-muted">{error}</p>
            <button onClick={load} className="mt-3 text-brand text-sm font-semibold hover:underline">{t('list.retry')}</button>
          </Card>
        ) : items.length === 0 ? (
          <Card pad="lg" className="text-center py-16">
            <span className="inline-flex w-14 h-14 rounded-2xl bg-field text-ink-muted items-center justify-center mb-3"><Icon name="search" size={26} /></span>
            <p className="text-sm text-ink-muted">{debouncedQ || filter !== 'ALL' ? t('list.emptyFiltered') : t('list.emptyAll')}</p>
            <button onClick={() => navigate('/scan')} className="mt-3 text-brand text-sm font-semibold hover:underline">{t('list.startFirst')}</button>
          </Card>
        ) : (
          <>
            <div className="flex flex-col gap-2.5">
              {items.map((s) => {
                const m = MODE_META[s.mode]
                const st = STATUS[s.status]
                const clickable = s.status === 'DONE'
                return (
                  <Card
                    key={s.id}
                    pad="none"
                    interactive={clickable}
                    onClick={() => clickable && navigate(`/report/${s.id}`)}
                    className="px-[18px] py-4 flex items-center gap-4"
                  >
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: m.soft, color: m.color }}>
                      <Icon name={m.icon} size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge tone={s.mode === 'WEBSITE' ? 'brand' : s.mode === 'GITHUB_REPO' ? 'purple' : 'success'} size="sm">{m.tag}</Badge>
                        <p className="text-[14.5px] font-semibold text-ink truncate">{s.target}</p>
                      </div>
                      <p className="text-[12.5px] text-ink-muted">
                        {formatDateTime(s.createdAt)}
                        {s.status === 'DONE' && s.total > 0 && ` ${t('list.item.vulnCount', { count: s.total })}`}
                        {s.loc ? ` ${t('list.item.lines', { count: s.loc.toLocaleString('ko-KR') })}` : ''}
                      </p>
                    </div>
                    {s.status === 'DONE' && s.maxCvss > 0 && (
                      <Badge tone={s.maxCvss >= 9 ? 'critical' : s.maxCvss >= 7 ? 'high' : s.maxCvss >= 4 ? 'medium' : 'low'} size="sm">
                        CVSS {s.maxCvss.toFixed(1)}
                      </Badge>
                    )}
                    <Badge tone={st.tone} size="sm">{t(`status.${st.key}`)}</Badge>
                    {clickable && <Icon name="chevron-right" size={16} className="text-ink-faint" />}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setTarget(s) }}
                      className="w-8 h-8 -mr-1 rounded-lg flex items-center justify-center text-ink-faint hover:text-danger hover:bg-danger-soft transition-colors shrink-0"
                      aria-label={t('list.item.deleteAriaLabel')}
                    >
                      <Icon name="trash-2" size={16} />
                    </button>
                  </Card>
                )
              })}
            </div>

            {/* 페이지네이션 */}
            <div className="flex items-center justify-between gap-3 mt-5">
              <p className="text-[12.5px] text-ink-muted">
                {t('pagination.totalLabel')} <span className="text-ink-sub font-semibold tnum">{total.toLocaleString('ko-KR')}</span>{t('pagination.totalSuffix')}
              </p>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" leftIcon="chevron-left"
                  disabled={data?.first ?? true} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                  {t('pagination.prev')}
                </Button>
                <span className="px-2 text-[13px] text-ink-sub tabular-nums">
                  {totalPages === 0 ? 0 : page + 1} / {totalPages}
                </span>
                <Button variant="outline" size="sm" rightIcon="chevron-right"
                  disabled={data?.last ?? true} onClick={() => setPage((p) => p + 1)}>
                  {t('pagination.next')}
                </Button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* 삭제 확인 */}
      <Modal
        open={!!target}
        onClose={() => !deleting && setTarget(null)}
        title={t('deleteModal.title')}
        width={420}
        footer={
          <>
            <Button variant="outline" block onClick={() => setTarget(null)} disabled={deleting}>{t('deleteModal.cancel')}</Button>
            <Button variant="danger" block loading={deleting} onClick={confirmDelete}>{t('deleteModal.confirm')}</Button>
          </>
        }
      >
        <p className="text-[14px] text-ink-sub leading-relaxed">
          <span className="font-semibold text-ink break-all">{target?.target}</span> {t('deleteModal.body')}
        </p>
      </Modal>
    </div>
  )
}

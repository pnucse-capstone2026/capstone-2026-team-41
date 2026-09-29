import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AppNav from '../../../shared/ui/AppNav'
import Icon, { type IconName } from '../../../shared/ui/Icon'
import ProgressBar from '../../../shared/ui/ProgressBar'
import Button from '../../../shared/ui/Button'
import { MODE_META, type ScanMode } from '../../../shared/lib/mock'
import { useModeLabel } from '../../../shared/lib/planText'
import { isRealId, getScanJob } from '../../../shared/api/scan'

interface Stage { labelKey: string; icon: IconName }
const WEB_STAGES: Stage[] = [
  { labelKey: 'statusPage.stages.web.connect', icon: 'globe' },
  { labelKey: 'statusPage.stages.web.scan', icon: 'search' },
  { labelKey: 'statusPage.stages.web.analyze', icon: 'cpu' },
  { labelKey: 'statusPage.stages.web.report', icon: 'file-text' },
]
const CODE_STAGES: Stage[] = [
  { labelKey: 'statusPage.stages.code.fetch', icon: 'box' },
  { labelKey: 'statusPage.stages.code.analyze', icon: 'cpu' },
  { labelKey: 'statusPage.stages.code.taint', icon: 'shield' },
  { labelKey: 'statusPage.stages.code.report', icon: 'file-text' },
]

export default function StatusPage() {
  const { t } = useTranslation('scan')
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { state } = useLocation() as { state?: { target?: string; mode?: ScanMode } }
  const mode: ScanMode = state?.mode ?? 'WEBSITE'
  const target = state?.target ?? t('statusPage.targetFallback')
  const m = MODE_META[mode]
  const modeLabel = useModeLabel(mode)
  const stages = mode === 'GITHUB_REPO' ? CODE_STAGES : WEB_STAGES
  const mockReportId = mode === 'GITHUB_REPO' ? 's-1039' : mode === 'GITHUB_ACTIONS' ? 's-1036' : 's-1041'
  const real = isRealId(id)

  const [progress, setProgress] = useState(real ? 8 : 6)
  const [failed, setFailed] = useState(false)
  const [failReason, setFailReason] = useState<string | null>(null)

  useEffect(() => {
    if (real) {
      // 실제 백엔드(ZAP) 스캔 — 상태 폴링
      let stopped = false
      let timer: ReturnType<typeof setTimeout>
      const poll = async () => {
        try {
          const job = await getScanJob(id)
          if (job.status === 'COMPLETED') {
            setProgress(100)
            setTimeout(() => navigate(`/report/${id}`, { replace: true }), 500)
            return
          }
          if (job.status === 'FAILED') { setFailReason(job.failureReason ?? null); setFailed(true); return }
          setProgress((p) => Math.min(90, p + (job.status === 'RUNNING' ? 7 : 2)))
        } catch { /* 일시 오류 — 계속 폴링 */ }
        if (!stopped) timer = setTimeout(poll, 2500)
      }
      timer = setTimeout(poll, 700)
      return () => { stopped = true; clearTimeout(timer) }
    }
    // 목 시뮬레이션 — 데모용 목 리포트 id(예: s-1039)로 들어온 경우에만
    const t = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 9 + 4
        if (next >= 100) {
          clearInterval(t)
          setTimeout(() => navigate(`/report/${mockReportId}`, { replace: true }), 600)
          return 100
        }
        return next
      })
    }, 520)
    return () => clearInterval(t)
  }, [real, id, navigate, mockReportId])

  const activeStage = Math.min(stages.length - 1, Math.floor((progress / 100) * stages.length))

  if (failed) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <AppNav />
        <main className="flex-1 flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-[440px] text-center fade-up">
            <span className="inline-flex w-14 h-14 rounded-2xl bg-danger-soft text-danger items-center justify-center mb-4"><Icon name="alert-triangle" size={26} /></span>
            <h2 className="text-[20px] font-bold text-ink">{t('statusPage.failed.title')}</h2>
            <p className="mt-1.5 text-[13.5px] text-ink-muted">{failReason || t('statusPage.failed.defaultReason')}</p>
            {failReason?.includes('App') && (
              <div className="mt-4 rounded-xl bg-warning-soft px-4 py-3 text-left">
                <p className="text-[12.5px] text-[#9a5b00] leading-relaxed">
                  {t('statusPage.failed.privateRepoNotice1')} <b>ScanOps App</b>{t('statusPage.failed.privateRepoNotice2')} <b>“Only select repositories”</b>{t('statusPage.failed.privateRepoNotice3')}
                </p>
              </div>
            )}
            <div className="mt-5 flex gap-2 justify-center">
              {failReason?.includes('App') && (
                <Button variant="dark" leftIcon="github" onClick={() => navigate('/integrations')}>{t('statusPage.failed.installAppButton')}</Button>
              )}
              <Button variant="outline" onClick={() => navigate('/reports')}>{t('statusPage.failed.historyButton')}</Button>
              <Button onClick={() => navigate('/scan')}>{t('statusPage.failed.retryButton')}</Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <AppNav />
      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[460px] fade-up">
          <div className="flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-bold mb-6" style={{ background: m.soft, color: m.color }}>
              <Icon name={m.icon} size={15} /> {m.tag} · {modeLabel}{real && t('statusPage.realScanSuffix')}
            </span>

            <div className="relative w-28 h-28 mb-5">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="44" fill="none" stroke="var(--color-field)" strokeWidth="8" />
                <circle cx="50" cy="50" r="44" fill="none" stroke={m.color} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 44} strokeDashoffset={2 * Math.PI * 44 * (1 - progress / 100)}
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[24px] font-bold text-ink tnum">{Math.floor(progress)}%</span>
              </div>
            </div>

            <h2 className="text-[20px] font-bold text-ink">{progress >= 100 ? t('statusPage.completedTitle') : t('statusPage.inProgressTitle')}</h2>
            <p className="mt-1 text-[13.5px] text-ink-muted truncate max-w-full">{target}</p>
          </div>

          <div className="mt-7 bg-white border border-line rounded-2xl p-5 flex flex-col gap-3">
            {stages.map((s, i) => {
              const doneStage = i < activeStage || progress >= 100
              const current = i === activeStage && progress < 100
              return (
                <div key={s.labelKey} className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    doneStage ? 'bg-success-soft text-success' : current ? 'bg-brand-soft text-brand' : 'bg-field text-ink-faint'
                  }`}>
                    {doneStage ? <Icon name="check" size={15} strokeWidth={3} />
                      : current ? <span className="w-3.5 h-3.5 rounded-full border-2 border-brand border-t-transparent spin" />
                      : <Icon name={s.icon} size={15} />}
                  </span>
                  <span className={`text-[13.5px] ${doneStage || current ? 'text-ink font-medium' : 'text-ink-muted'}`}>{t(s.labelKey)}</span>
                </div>
              )
            })}
            <ProgressBar value={progress} color={m.color} className="mt-1" height={6} />
          </div>

          <p className="mt-5 text-center text-[12px] text-ink-faint flex items-center justify-center gap-1.5">
            <Icon name="lock" size={13} />
            {real
              ? t(mode === 'WEBSITE' ? 'statusPage.footer.webRealNotice' : 'statusPage.footer.codeRealNotice')
              : t('statusPage.footer.mockNotice')}
          </p>
        </div>
      </main>
    </div>
  )
}

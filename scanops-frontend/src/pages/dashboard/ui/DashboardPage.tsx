import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AppNav from '../../../shared/ui/AppNav'
import Card from '../../../shared/ui/Card'
import Button from '../../../shared/ui/Button'
import Icon, { type IconName } from '../../../shared/ui/Icon'
import Badge from '../../../shared/ui/Badge'
import ProgressBar from '../../../shared/ui/ProgressBar'
import TokenBalance from '../../../shared/ui/TokenBalance'
import { useAuth } from '../../../shared/lib/auth'
import { MODE_META, relativeTime, type ScanSummary } from '../../../shared/lib/mock'
import { fetchRecentScans } from '../../../shared/api/scan'
import { fetchWallet, type TokenWallet } from '../../../shared/api/tokens'

export default function DashboardPage() {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()
  const { user } = useAuth()
  const [scans, setScans] = useState<ScanSummary[] | null>(null)
  const [wallet, setWallet] = useState<TokenWallet | null>(null)

  useEffect(() => {
    fetchRecentScans().then(setScans)
    fetchWallet().then(setWallet)
  }, [])

  // 마이페이지(MyPage)와 동일하게 "잔여"를 그대로 보여준다 — 지급량에서 역산한 "사용량"은
  // 충전·체험 보너스로 잔여가 월 한도를 넘는 경우 음수가 나와 마이페이지와 값이 어긋났다.
  const dastRemaining = wallet?.dastAvailable
  const sastRemaining = wallet?.sourceLinesLeft

  return (
    <div className="min-h-screen bg-surface">
      <AppNav />
      <main className="max-w-[1080px] mx-auto px-6 py-8 fade-up">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[26px] font-bold text-ink tracking-tight">{t('greeting', { name: user?.name })}</h1>
            <p className="mt-1 text-[14.5px] text-ink-muted">{t('subtitle')}</p>
          </div>
          <Button data-tour="dashboard-new-scan" leftIcon="target" onClick={() => navigate('/scan')}>{t('newScan')}</Button>
        </div>

        {/* usage */}
        <div data-tour="usage-cards" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <UsageCard icon="globe" label={t('usage.dastLabel')} remaining={dastRemaining} limit={wallet?.dastMonthlyLimit} unit={t('usage.unitCount')} color="var(--color-scan-web)" />
          <UsageCard icon="box" label={t('usage.sastLabel')} remaining={sastRemaining} limit={wallet?.sourceLinesMonthlyLimit} unit={t('usage.unitLines')} color="var(--color-scan-code)" big />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          {/* token balance */}
          <Card data-tour="posture-card" className="lg:col-span-2" pad="lg">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-bold text-ink">{t('tokenStatus.title')}</h2>
              <button onClick={() => navigate('/mypage')} className="text-[13px] text-brand font-semibold hover:underline flex items-center gap-1">
                {t('tokenStatus.myPage')} <Icon name="chevron-right" size={14} />
              </button>
            </div>
            <div className="mt-4">
              <TokenBalance wallet={wallet} />
            </div>
          </Card>

          {/* model edge */}
          <Card pad="lg" className="bg-gradient-to-br from-[#f3f8ff] to-white border-brand-soft">
            <div className="flex items-center gap-2 text-brand">
              <Icon name="cpu" size={18} />
              <span className="text-[13px] font-bold">{t('engine.title')}</span>
            </div>
            <p className="mt-2 text-[13.5px] text-ink-sub leading-relaxed">
              {t('engine.desc')}
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Mini label={t('engine.externalLabel')} value={t('engine.externalValue')} />
              <Mini label={t('engine.methodLabel')} value={t('engine.methodValue')} />
            </div>
          </Card>
        </div>

        {/* recent scans */}
        <Card data-tour="recent-scans-card" className="mt-4" pad="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h2 className="text-[17px] font-bold text-ink">{t('recent.title')}</h2>
            <button onClick={() => navigate('/reports')} className="text-[13px] text-brand font-semibold hover:underline">{t('recent.viewAll')}</button>
          </div>
          {!scans ? (
            <div className="p-5 flex flex-col gap-2.5">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-xl skeleton" />)}</div>
          ) : (
            <div className="divide-y divide-line">
              {scans.slice(0, 4).map((s) => {
                const m = MODE_META[s.mode]
                return (
                  <button
                    key={s.id}
                    onClick={() => navigate(s.status === 'DONE' ? `/report/${s.id}` : s.status === 'FAILED' ? '/reports' : `/scan/${s.id}/status`)}
                    className="w-full flex items-center gap-3.5 px-5 py-3.5 text-left hover:bg-surface transition-colors"
                  >
                    <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: m.soft, color: m.color }}>
                      <Icon name={m.icon} size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-ink truncate">{s.target}</p>
                      <p className="text-[12px] text-ink-muted">{m.tag} · {relativeTime(s.createdAt)}</p>
                    </div>
                    {s.status === 'DONE' && s.maxCvss > 0 ? (
                      <Badge tone={s.maxCvss >= 9 ? 'critical' : s.maxCvss >= 7 ? 'high' : s.maxCvss >= 4 ? 'medium' : 'low'} size="sm">
                        CVSS {s.maxCvss.toFixed(1)}
                      </Badge>
                    ) : s.status === 'DONE' ? (
                      <Badge tone="success" size="sm">{t('recent.done')}</Badge>
                    ) : s.status === 'FAILED' ? (
                      <Badge tone="danger" size="sm">{t('recent.failed')}</Badge>
                    ) : (
                      <Badge tone="brand" size="sm">{t('recent.inProgress')}</Badge>
                    )}
                    <Icon name="chevron-right" size={16} className="text-ink-faint" />
                  </button>
                )
              })}
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}

function UsageCard({ icon, label, remaining, limit, unit, color, big }: { icon: IconName; label: string; remaining?: number; limit?: number; unit: string; color: string; big?: boolean }) {
  const { t } = useTranslation('dashboard')
  const ready = remaining != null && limit != null
  // 충전/체험 보너스로 잔여가 월 한도보다 많을 수 있다 — 막대만 100%로 잘라 보여준다(숫자는 그대로).
  const pct = ready ? Math.min(100, (remaining! / limit!) * 100) : 0
  const low = ready && limit! > 0 && remaining! / limit! < 0.15
  const fmt = (n: number) => (big ? n.toLocaleString('ko-KR') : String(n))
  return (
    <Card pad="md">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-ink-sub">
          <span style={{ color }}><Icon name={icon} size={16} /></span>{label}
        </span>
        {low && <Badge tone="warning" size="sm">{t('usage.low')}</Badge>}
      </div>
      {ready ? (
        <p className="mt-2.5 text-ink">
          <span className="text-[22px] font-bold tnum">{fmt(remaining!)}</span>
          <span className="text-[13px] text-ink-muted">{t('usage.perMonth', { limit: fmt(limit!), unit })}</span>
        </p>
      ) : (
        <div className="mt-2.5 h-7 w-24 rounded skeleton" />
      )}
      <ProgressBar value={pct} color={low ? 'var(--color-warning)' : color} className="mt-2.5" height={6} />
    </Card>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white border border-brand-soft px-3 py-2">
      <p className="text-[11px] text-ink-muted">{label}</p>
      <p className="text-[18px] font-bold text-brand tnum">{value}</p>
    </div>
  )
}

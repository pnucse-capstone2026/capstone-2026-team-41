import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AppNav from '../../../shared/ui/AppNav'
import Card from '../../../shared/ui/Card'
import Button from '../../../shared/ui/Button'
import Badge from '../../../shared/ui/Badge'
import Avatar from '../../../shared/ui/Avatar'
import Icon, { type IconName } from '../../../shared/ui/Icon'
import Modal from '../../../shared/ui/Modal'
import TokenBalance from '../../../shared/ui/TokenBalance'
import { useToast } from '../../../shared/ui/Toast'
import { useAuth } from '../../../shared/lib/auth'
import { won } from '../../../shared/lib/mock'
import { usePlanText } from '../../../shared/lib/planText'
import { fetchWallet, purchaseDast, purchaseTokens, type TokenWallet } from '../../../shared/api/tokens'
import { fetchSurveyStatus } from '../../../shared/api/survey'

type TopUpKind = 'DAST' | 'TOKEN'

export default function MyPage() {
  const { t } = useTranslation('mypage')
  const navigate = useNavigate()
  const { user } = useAuth()
  const [wallet, setWallet] = useState<TokenWallet | null>(null)
  const [topUp, setTopUp] = useState<TopUpKind | null>(null)
  const [surveyDone, setSurveyDone] = useState(false)
  const reload = () => fetchWallet().then(setWallet).catch(() => setWallet(null))
  useEffect(() => {
    reload()
    fetchSurveyStatus().then((s) => setSurveyDone(s.completed)).catch(() => {})
  }, [])
  const plan = usePlanText(user?.plan ?? 'FREE')
  if (!user) return null

  return (
    <div className="min-h-screen bg-surface">
      <AppNav />
      <main className="max-w-[820px] mx-auto px-6 py-8 fade-up">
        <h1 className="text-[26px] font-bold text-ink tracking-tight">{t('title')}</h1>

        {/* profile */}
        <Card pad="lg" className="mt-5">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} size={56} />
            <div className="min-w-0 flex-1">
              <p className="text-[18px] font-bold text-ink">{user.name}</p>
              <p className="text-[13.5px] text-ink-muted">{user.email}</p>
              {user.githubLogin && (
                <span className="inline-flex items-center gap-1 mt-1 text-[12px] text-ink-sub">
                  <Icon name="github" size={13} /> @{user.githubLogin}
                </span>
              )}
            </div>
            <Button variant="outline" size="sm" leftIcon="settings" onClick={() => navigate('/settings')}>{t('settings')}</Button>
          </div>
        </Card>

        {/* plan + token balance */}
        <Card pad="lg" className="mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-bold text-ink">{plan.name} {t('plan.suffix')}</h2>
              {plan.id === 'PRO' && <Badge tone="brand" size="sm">{t('plan.popular')}</Badge>}
              {wallet?.team && <Badge tone="neutral" size="sm">{t('plan.teamWallet')}</Badge>}
            </div>
            <Button size="sm" variant="weak" onClick={() => navigate('/pricing')}>{t('plan.change')}</Button>
          </div>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {plan.price === 0 ? t('plan.free') : `${won(plan.price)}${plan.per}`}
            {wallet?.periodEnd && ` · ${t('plan.nextBilling', { date: new Date(wallet.periodEnd).toLocaleDateString('ko-KR') })}`}
          </p>

          <div className="mt-5"><TokenBalance wallet={wallet} /></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <CapacityTile
              icon="globe" label={t('capacity.website')} value={wallet?.websiteScansLeft} unit={t('capacity.websiteUnit')}
              color="var(--color-scan-web)" onTopUp={wallet ? () => setTopUp('DAST') : undefined}
            />
            <CapacityTile
              icon="box" label={t('capacity.source')} value={wallet?.sourceLinesLeft} unit={t('capacity.sourceUnit')}
              color="var(--color-scan-code)" big onTopUp={wallet ? () => setTopUp('TOKEN') : undefined}
            />
          </div>
        </Card>

        {/* beta survey */}
        <Card pad="lg" className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${surveyDone ? 'bg-success-soft text-success' : 'bg-brand-soft text-brand'}`}>
              <Icon name={surveyDone ? 'check-circle' : 'edit-3'} size={18} />
            </span>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-[14.5px] font-bold text-ink">{t('survey.title')}</p>
                <p className="text-[12.5px] text-ink-muted">
                  {surveyDone ? t('survey.done') : t('survey.todo')}
                </p>
              </div>
              {surveyDone && <Badge tone="success" size="sm">{t('survey.doneBadge')}</Badge>}
            </div>
          </div>
          <Button size="sm" disabled={surveyDone} onClick={() => navigate('/survey')}>
            {surveyDone ? t('survey.doneButton') : t('survey.startButton')}
          </Button>
        </Card>

        {/* quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <QuickLink icon="github" title={t('quickLinks.integrations.title')} sub={t('quickLinks.integrations.sub')} onClick={() => navigate('/integrations')} />
          <QuickLink icon="users" title={t('quickLinks.team.title')} sub={t('quickLinks.team.sub')} onClick={() => navigate('/team')} />
          <QuickLink icon="credit-card" title={t('quickLinks.billing.title')} sub={t('quickLinks.billing.sub')} onClick={() => navigate('/settings')} />
          <QuickLink icon="file-text" title={t('quickLinks.reports.title')} sub={t('quickLinks.reports.sub')} onClick={() => navigate('/reports')} />
        </div>
      </main>

      {wallet && topUp && (
        <TopUpModal
          kind={topUp}
          wallet={wallet}
          onClose={() => setTopUp(null)}
          onDone={(w) => { setWallet(w); setTopUp(null) }}
        />
      )}
    </div>
  )
}

/**
 * 토큰(SAST·액션) 또는 DAST(웹 점검) 횟수 충전. 둘 다 5,000원 단위 구좌를 산다.
 *
 * ⚠️ PG 미연동 — 실제 카드 승인 없이 백엔드가 즉시 확정한다(개발/데모 전용, 다른 결제
 * 흐름과 동일한 한계). 결제 지연만 흉내 낸다.
 */
function TopUpModal({ kind, wallet, onClose, onDone }: {
  kind: TopUpKind; wallet: TokenWallet; onClose: () => void; onDone: (w: TokenWallet) => void
}) {
  const { t } = useTranslation('mypage')
  const { toast } = useToast()
  const [units, setUnits] = useState(1)
  const [loading, setLoading] = useState(false)

  const isDast = kind === 'DAST'
  const priceKrw = isDast ? wallet.dastTopUpPriceKrw : wallet.topUpPriceKrw
  const amountPerUnit = isDast ? wallet.dastTopUpCount : wallet.topUpTokens
  const totalAmount = amountPerUnit * units
  const totalPrice = priceKrw * units
  const amountLabel = isDast ? t('topUp.amountDast', { count: totalAmount }) : t('topUp.amountToken', { count: totalAmount.toLocaleString('ko-KR') })

  const confirm = async () => {
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 900)) // 목업 결제 지연
      await (isDast ? purchaseDast(units) : purchaseTokens(units))
      const fresh = await fetchWallet()
      onDone(fresh)
      toast(t('topUp.success', { amount: amountLabel }), 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : t('topUp.failure'), 'danger')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isDast ? t('topUp.titleDast') : t('topUp.titleToken')}
      footer={
        <>
          <Button variant="ghost" block onClick={onClose}>{t('topUp.cancel')}</Button>
          <Button block loading={loading} onClick={confirm}>{t('topUp.pay', { amount: won(totalPrice) })}</Button>
        </>
      }
    >
      <p className="text-[13.5px] text-ink-sub leading-relaxed">
        {isDast
          ? t('topUp.descDast', { price: won(priceKrw), count: amountPerUnit })
          : t('topUp.descToken', { price: won(priceKrw), count: amountPerUnit.toLocaleString('ko-KR') })}
      </p>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-surface border border-line px-4 py-3">
        <span className="text-[13.5px] font-medium text-ink-sub">{t('topUp.units')}</span>
        <div className="flex items-center gap-3">
          <button
            type="button" onClick={() => setUnits((u) => Math.max(1, u - 1))}
            className="w-8 h-8 rounded-lg bg-white border border-line-strong text-ink flex items-center justify-center hover:bg-field disabled:opacity-40"
            disabled={units <= 1}
          ><Icon name="minus" size={14} /></button>
          <span className="w-8 text-center text-[15px] font-bold tnum">{units}</span>
          <button
            type="button" onClick={() => setUnits((u) => Math.min(20, u + 1))}
            className="w-8 h-8 rounded-lg bg-white border border-line-strong text-ink flex items-center justify-center hover:bg-field"
          ><Icon name="plus" size={14} /></button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between px-1">
        <span className="text-[13px] text-ink-muted">{t('topUp.amount')}</span>
        <span className="text-[13.5px] font-semibold text-ink tnum">{amountLabel}</span>
      </div>
      <div className="mt-1 flex items-center justify-between px-1">
        <span className="text-[13px] text-ink-muted">{t('topUp.price')}</span>
        <span className="text-[15px] font-bold text-ink tnum">{won(totalPrice)}</span>
      </div>
    </Modal>
  )
}

function CapacityTile({ icon, label, value, unit, color, big, onTopUp }: {
  icon: IconName; label: string; value?: number; unit: string; color: string; big?: boolean; onTopUp?: () => void
}) {
  const { t } = useTranslation('mypage')
  const ready = value != null
  const fmt = (n: number) => (big ? n.toLocaleString('ko-KR') : String(n))
  return (
    <div className="rounded-xl bg-surface border border-line p-3.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-sub"><span style={{ color }}><Icon name={icon} size={14} /></span>{label}</span>
        {onTopUp && (
          <button
            type="button" onClick={onTopUp}
            className="text-[11.5px] font-semibold text-brand hover:text-brand-hover flex items-center gap-0.5"
          ><Icon name="plus" size={12} />{t('capacity.topUp')}</button>
        )}
      </div>
      <p className="mt-1.5 text-ink"><span className="text-[16px] font-bold tnum">{ready ? fmt(value!) : '—'}</span><span className="text-[12px] text-ink-muted"> {unit}</span></p>
    </div>
  )
}

function QuickLink({ icon, title, sub, onClick }: { icon: IconName; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex items-center gap-3 rounded-2xl bg-white border border-line p-4 text-left transition-all hover:border-line-strong hover:shadow-[0px_2px_8px_rgba(0,0,0,0.06)]">
      <span className="w-10 h-10 rounded-xl bg-field text-ink-sub flex items-center justify-center shrink-0 group-hover:bg-brand-soft group-hover:text-brand transition-colors"><Icon name={icon} size={19} /></span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-ink">{title}</p>
        <p className="text-[12px] text-ink-muted">{sub}</p>
      </div>
      <Icon name="chevron-right" size={16} className="text-ink-faint" />
    </button>
  )
}

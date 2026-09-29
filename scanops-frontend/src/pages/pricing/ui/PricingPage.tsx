import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AppNav from '../../../shared/ui/AppNav'
import Logo from '../../../shared/ui/Logo'
import Card from '../../../shared/ui/Card'
import Button from '../../../shared/ui/Button'
import Badge from '../../../shared/ui/Badge'
import Icon from '../../../shared/ui/Icon'
import { useAuth } from '../../../shared/lib/auth'
import { won, type PlanId } from '../../../shared/lib/mock'
import { usePlansText } from '../../../shared/lib/planText'

interface DisplayPlan {
  id: PlanId
  name: string
  price: string
  per: string
  desc: string
  popular?: boolean
  trial?: string
  feats: [string, string][]
}

export default function PricingPage() {
  const { t } = useTranslation('pricing')
  const navigate = useNavigate()
  const { user } = useAuth()
  const plans = usePlansText()

  const PERSONAL: DisplayPlan[] = (['FREE', 'PRO', 'MAX'] as PlanId[]).map((id) => {
    const p = plans.find((x) => x.id === id)!
    return {
      id, name: p.name, price: p.price === 0 ? '₩0' : won(p.price), per: p.per, desc: p.desc,
      popular: p.popular, trial: p.trial,
      feats: [
        [t('card.dast'), p.dast],
        [t('card.sastActions'), p.sastActions],
        [t('card.highlight'), p.highlight],
      ],
    }
  })

  const TEAM = plans.find((p) => p.id === 'TEAM')!
  const TEAM_PLAN: DisplayPlan = {
    id: 'TEAM', name: TEAM.name, price: won(TEAM.price), per: TEAM.per, desc: TEAM.desc, popular: true,
    feats: [[t('card.dast'), TEAM.dast], [t('card.sastActions'), TEAM.sastActions], [t('team.memberCount'), t('team.memberCountValue')]],
  }
  // 멤버 1명 추가 시 SAST·액션 공용 토큰 +69,000(=23만 줄 상당)이 그대로 늘어난다.
  const TEAM_ADDON: [string, string][] = [
    [t('team.addon.member'), t('team.addon.memberValue')], [t('team.addon.dast'), t('team.addon.dastValue')],
    [t('team.addon.sastActions'), t('team.addon.sastActionsValue')],
  ]
  const OVERAGE: [string, string][] = [
    [t('overage.sastActions'), t('overage.sastActionsValue')], [t('overage.dast'), t('overage.dastValue')],
  ]

  const choose = (id: PlanId) => {
    if (!user) return navigate('/signup')
    if (id === 'FREE') return navigate('/scan')
    if (id === 'TEAM') return navigate('/checkout/team')
    navigate(`/checkout/${id.toLowerCase()}`)
  }

  return (
    <div className="min-h-screen bg-surface">
      {user ? <AppNav /> : (
        <header className="h-16 flex items-center justify-between px-6 sm:px-10 bg-white border-b border-line">
          <Logo onClick={() => navigate('/')} />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>{t('header.login')}</Button>
            <Button size="sm" onClick={() => navigate('/signup')}>{t('header.signup')}</Button>
          </div>
        </header>
      )}

      <main className="max-w-[1180px] mx-auto px-6 py-14">
        <div className="flex flex-col items-center text-center gap-2.5 mb-12">
          <Badge tone="brand">{t('hero.badge')}</Badge>
          <h1 className="text-3xl font-bold text-ink tracking-tight">{t('hero.title')}</h1>
          <p className="text-[15px] text-ink-muted max-w-xl">
            {t('hero.desc')}
          </p>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-ink">{t('personal.title')}</h2>
            <span className="text-[13px] text-ink-muted">{t('personal.sub')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {PERSONAL.map((p) => <PlanCard key={p.id} plan={p} current={user?.plan === p.id} onChoose={choose} />)}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-ink">{t('team.title')}</h2>
            <span className="text-[13px] text-ink-muted">{t('team.sub')}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            <PlanCard plan={TEAM_PLAN} current={user?.plan === 'TEAM'} onChoose={choose} />
            <Card pad="lg" className="flex flex-col">
              <h3 className="text-lg font-bold text-ink">{t('team.addonTitle')}</h3>
              <p className="mt-1 text-[13px] text-ink-muted">{t('team.addonDesc')}</p>
              <div className="h-px bg-line my-5" />
              <ul className="flex flex-col gap-3">
                {TEAM_ADDON.map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2"><span className="text-brand"><Icon name="plus" size={14} /></span><span className="text-[13px] text-ink-sub font-medium">{k}</span></span>
                    <span className="text-[13px] font-semibold text-ink">{v}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        <section className="mt-12">
          <Card pad="lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
              <h2 className="text-lg font-bold text-ink">{t('overage.title')}</h2>
              <span className="text-[13px] text-ink-muted">{t('overage.sub')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {OVERAGE.map(([k, v]) => (
                <div key={k} className="rounded-xl bg-field px-4 py-3.5">
                  <div className="text-[13px] text-ink-sub font-medium">{k}</div>
                  <div className="mt-1 text-[15px] font-bold text-ink">{v}</div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <p className="mt-8 flex items-center gap-2 text-[13px] text-ink-muted">
          <Icon name="info" size={15} />
          {t('footnote')}
        </p>
      </main>
    </div>
  )
}

function PlanCard({ plan, current, onChoose }: { plan: DisplayPlan; current?: boolean; onChoose: (id: PlanId) => void }) {
  const { t } = useTranslation('pricing')
  const notSupported = t('card.notSupported')
  const betaLocked = plan.id === 'MAX' || plan.id === 'TEAM'
  return (
    <Card pad="lg" className={`flex flex-col ${plan.popular ? 'border-2 border-brand' : ''}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-lg font-bold text-ink">{plan.name}</h2>
        {plan.popular && <Badge tone="brand" solid size="sm">{t('card.popular')}</Badge>}
        {plan.trial && <Badge tone="brand" size="sm">{plan.trial}</Badge>}
        {current && <Badge tone="success" size="sm">{t('card.current')}</Badge>}
      </div>
      <p className="mt-1 text-[13px] text-ink-muted">{plan.desc}</p>
      <div className="mt-4 flex items-baseline gap-0.5">
        <span className="text-[30px] font-bold text-ink tracking-tight tnum">{plan.price}</span>
        <span className="text-sm text-ink-muted font-medium">{plan.per}</span>
      </div>

      <Button
        variant={plan.popular ? 'primary' : 'outline'}
        block
        className="mt-5"
        disabled={current || betaLocked}
        onClick={() => onChoose(plan.id)}
      >
        {betaLocked ? t('card.betaLocked') : current ? t('card.using') : plan.id === 'FREE' ? t('card.startFree') : t('card.startPlan', { name: plan.name })}
      </Button>

      <div className="h-px bg-line my-5" />
      <ul className="flex flex-col gap-3">
        {plan.feats.map(([k, v]) => {
          const off = v === notSupported
          return (
            <li key={k} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className={off ? 'text-ink-faint' : 'text-success'}>
                  <Icon name={off ? 'x' : 'check'} size={14} strokeWidth={off ? 2 : 3} />
                </span>
                <span className="text-[13px] text-ink-sub font-medium">{k}</span>
              </span>
              <span className={`text-[13px] font-semibold ${off ? 'text-ink-faint' : 'text-ink'}`}>{v}</span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

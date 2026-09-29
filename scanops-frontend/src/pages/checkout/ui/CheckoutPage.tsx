import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Logo from '../../../shared/ui/Logo'
import Card from '../../../shared/ui/Card'
import Button from '../../../shared/ui/Button'
import Input from '../../../shared/ui/Input'
import Icon from '../../../shared/ui/Icon'
import { useAuth } from '../../../shared/lib/auth'
import { useToast } from '../../../shared/ui/Toast'
import { PLANS, won, type PlanId } from '../../../shared/lib/mock'
import { usePlanText } from '../../../shared/lib/planText'
import { activateSubscription, startTrial } from '../../../shared/api/subscriptions'

export default function CheckoutPage() {
  const { t } = useTranslation('checkout')
  const { plan: planParam } = useParams<{ plan: string }>()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const { toast } = useToast()
  const planId = PLANS.find((p) => p.id === (planParam?.toUpperCase() as PlanId))?.id ?? PLANS[1].id
  const plan = usePlanText(planId)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const vat = Math.round(plan.price * 0.1)
  const total = plan.price + vat

  /**
   * ⚠️ PG 미연동 — 카드 입력값은 검증하지 않고, 백엔드가 결제 성공을 가정하고 바로
   * 구독을 확정한다(다른 결제 흐름과 동일한 한계, 운영 배포 전 PG 연동 필수).
   */
  const pay = async () => {
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 1100)) // 목업 결제 지연
      if (plan.trial) {
        try {
          await startTrial()
        } catch {
          // 이미 체험을 썼던 계정이면 바로 결제로 전환
          await activateSubscription(plan.id)
        }
      } else {
        await activateSubscription(plan.id)
      }
      await refreshUser() // /api/auth/me를 다시 불러 nav·마이페이지의 플랜 표시를 갱신
      setDone(true)
      toast(t('toast.started', { planName: plan.name }), 'success')
      setTimeout(() => navigate('/dashboard', { replace: true }), 1400)
    } catch (e) {
      toast(e instanceof Error ? e.message : t('toast.failed'), 'danger')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <span className="w-16 h-16 rounded-full bg-success-soft text-success flex items-center justify-center mb-5 fade-up"><Icon name="check" size={32} strokeWidth={3} /></span>
        <h1 className="text-[22px] font-bold text-ink">{t('done.title')}</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-muted">{t('done.desc', { planName: plan.name })}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="h-16 flex items-center px-6 sm:px-10 bg-white border-b border-line">
        <Logo onClick={() => navigate('/pricing')} />
      </header>
      <main className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-[860px] grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 fade-up">
          {/* payment form */}
          <Card pad="lg">
            <h1 className="text-[20px] font-bold text-ink">{t('form.title')}</h1>
            <p className="mt-1 text-[13.5px] text-ink-muted">{t('form.desc')}</p>
            <div className="flex flex-col gap-4 mt-5">
              <Input label={t('form.cardNumber')} leftIcon="credit-card" placeholder="0000 0000 0000 0000" />
              <div className="grid grid-cols-2 gap-3">
                <Input label={t('form.expiry')} placeholder="MM/YY" />
                <Input label={t('form.cvc')} placeholder="123" />
              </div>
              <Input label={t('form.cardHolder')} placeholder="HONG GILDONG" />
            </div>
          </Card>

          {/* summary */}
          <div>
            <Card pad="lg">
              <h2 className="text-[15px] font-bold text-ink mb-3">{t('summary.title')}</h2>
              <div className="flex items-center justify-between py-2">
                <span className="text-[14px] text-ink-sub">{plan.name} {t('summary.planSuffix')}</span>
                <span className="text-[14px] font-semibold text-ink tnum">{won(plan.price)}{plan.per}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[14px] text-ink-sub">{t('summary.vat')}</span>
                <span className="text-[14px] text-ink-sub tnum">{won(vat)}</span>
              </div>
              <div className="h-px bg-line my-2" />
              <div className="flex items-center justify-between py-1">
                <span className="text-[15px] font-bold text-ink">{t('summary.total')}</span>
                <span className="text-[18px] font-bold text-ink tnum">{won(total)}</span>
              </div>
              {plan.trial && (
                <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-brand font-medium"><Icon name="zap" size={14} /> {plan.trial} {t('summary.trialSuffix')}</p>
              )}
              <Button block size="lg" loading={loading} className="mt-4" onClick={pay}>
                {plan.price === 0 ? t('summary.payFree') : t('summary.payButton', { amount: won(total) })}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11.5px] text-ink-faint"><Icon name="lock" size={12} /> {t('summary.cancelAnytime')}</p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

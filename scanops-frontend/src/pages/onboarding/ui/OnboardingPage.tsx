import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Logo from '../../../shared/ui/Logo'
import Icon, { type IconName } from '../../../shared/ui/Icon'
import Button from '../../../shared/ui/Button'
import Card from '../../../shared/ui/Card'
import { useAuth, getToken } from '../../../shared/lib/auth'
import { useToast } from '../../../shared/ui/Toast'
import { githubLinkUrl } from '../../../shared/lib/config'

export default function OnboardingPage() {
  const { t } = useTranslation('onboarding')
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const connected = !!user?.githubLogin

  // 실제 GitHub OAuth 연동 — 현재(이메일) 계정에 GitHub을 붙인다(같은 계정).
  const connectGithub = () => {
    const token = getToken()
    if (!token) { toast(t('loginRequired')); return }
    window.location.href = githubLinkUrl(token)
  }

  const steps = [t('steps.connectGithub'), t('steps.chooseStart')]

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="h-16 flex items-center px-6 sm:px-10">
        <Logo onClick={() => navigate('/dashboard')} />
      </header>

      <main className="flex-1 flex items-start justify-center px-6 py-8">
        <div className="w-full max-w-[520px] fade-up">
          {/* stepper */}
          <div className="flex items-center gap-2 mb-6">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold ${
                  i <= step ? 'bg-brand text-white' : 'bg-field text-ink-muted'
                }`}>{i + 1}</span>
                <span className={`text-[13px] font-semibold ${i <= step ? 'text-ink' : 'text-ink-muted'}`}>{s}</span>
                {i < steps.length - 1 && <div className="flex-1 h-px bg-line" />}
              </div>
            ))}
          </div>

          {step === 0 && (
            <Card pad="lg">
              <h1 className="text-[22px] font-bold text-ink">{t('step0.greeting', { name: user?.name })}</h1>
              <p className="mt-1.5 text-[14.5px] text-ink-sub">
                {t('step0.desc')}
              </p>

              <div className="mt-5 rounded-xl border border-line p-4 flex items-center gap-3.5">
                <span className="w-11 h-11 rounded-xl bg-ink text-white flex items-center justify-center shrink-0">
                  <Icon name="github" size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-semibold text-ink">
                    {connected ? t('step0.connectedTitle', { login: user?.githubLogin }) : t('step0.connectTitle')}
                  </p>
                  <p className="text-[12.5px] text-ink-muted">
                    {connected ? t('step0.connectedSub') : t('step0.connectSub')}
                  </p>
                </div>
                {connected ? (
                  <span className="text-success"><Icon name="check-circle" size={22} /></span>
                ) : (
                  <Button size="sm" variant="dark" leftIcon="github" onClick={connectGithub}>
                    {t('step0.connectButton')}
                  </Button>
                )}
              </div>

              <div className="mt-5 flex gap-2.5">
                <Button variant="ghost" block onClick={() => setStep(1)}>{t('step0.later')}</Button>
                <Button block rightIcon="arrow-right" onClick={() => setStep(1)}>{t('step0.next')}</Button>
              </div>
            </Card>
          )}

          {step === 1 && (
            <Card pad="lg">
              <h1 className="text-[22px] font-bold text-ink">{t('step1.title')}</h1>
              <p className="mt-1.5 text-[14.5px] text-ink-sub">{t('step1.desc')}</p>

              <div className="mt-5 flex flex-col gap-3">
                <StartOption icon="globe" tag={t('step1.options.website.tag')} title={t('step1.options.website.title')} sub={t('step1.options.website.sub')} onClick={() => navigate('/scan')} />
                <StartOption icon="box" tag={t('step1.options.repo.tag')} title={t('step1.options.repo.title')} sub={t('step1.options.repo.sub')} onClick={() => navigate(connected ? '/scan' : '/integrations')} />
                <StartOption icon="home" tag={t('step1.options.dashboard.tag')} title={t('step1.options.dashboard.title')} sub={t('step1.options.dashboard.sub')} onClick={() => navigate('/dashboard')} />
              </div>

              <button onClick={() => setStep(0)} className="mt-5 text-[13px] text-ink-muted font-medium hover:text-ink-sub flex items-center gap-1">
                <Icon name="chevron-left" size={15} /> {t('step1.back')}
              </button>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

function StartOption({ icon, tag, title, sub, onClick }: { icon: IconName; tag: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex items-center gap-3.5 rounded-xl border border-line p-4 text-left transition-all hover:border-brand hover:bg-brand-soft/40">
      <span className="w-11 h-11 rounded-xl bg-field group-hover:bg-white text-ink flex items-center justify-center shrink-0">
        <Icon name={icon} size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <span className="text-[11px] font-bold text-brand">{tag}</span>
        <p className="text-[15px] font-semibold text-ink">{title}</p>
        <p className="text-[12.5px] text-ink-muted">{sub}</p>
      </div>
      <Icon name="chevron-right" size={18} className="text-ink-faint group-hover:text-brand" />
    </button>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Logo from '../../../shared/ui/Logo'
import Input from '../../../shared/ui/Input'
import Button from '../../../shared/ui/Button'
import Checkbox from '../../../shared/ui/Checkbox'
import Icon from '../../../shared/ui/Icon'
import LanguageSwitcher from '../../../shared/ui/LanguageSwitcher'
import { useAuth } from '../../../shared/lib/auth'
import { GITHUB_AUTHORIZE_URL } from '../../../shared/lib/config'

const TERMS = [
  { key: 'tos', labelKey: 'signup.terms.tos', required: true },
  { key: 'privacy', labelKey: 'signup.terms.privacy', required: true },
  { key: 'marketing', labelKey: 'signup.terms.marketing', required: false },
] as const

export default function SignupPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const allChecked = TERMS.every((t) => checked[t.key])
  const requiredOk = TERMS.filter((t) => t.required).every((t) => checked[t.key])
  const toggleAll = () => {
    const next = !allChecked
    setChecked(Object.fromEntries(TERMS.map((t) => [t.key, next])))
  }
  const toggle = (k: string) => setChecked((c) => ({ ...c, [k]: !c[k] }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (pw.length < 8) return setError(t('signup.errors.passwordTooShort'))
    if (pw !== pw2) return setError(t('signup.errors.passwordMismatch'))
    if (!requiredOk) return setError(t('signup.errors.termsRequired'))
    setLoading(true)
    try {
      await signup(email, pw)
      navigate('/onboarding', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('signup.errors.signupFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="h-18 flex items-center justify-between px-6 sm:px-10 py-5">
        <Logo onClick={() => navigate('/')} />
        <LanguageSwitcher />
      </header>

      <main className="flex-1 flex items-start justify-center px-6 pb-16">
        <div className="w-full max-w-[400px] mt-8 sm:mt-10 flex flex-col items-center fade-up">
          <h1 className="text-[26px] font-bold text-ink tracking-tight">{t('signup.title')}</h1>
          <p className="mt-1.5 text-[15px] text-ink-muted">{t('signup.subtitle')}</p>

          <Button
            variant="github"
            size="lg"
            block
            leftIcon="github"
            className="mt-7"
            onClick={() => { window.location.href = GITHUB_AUTHORIZE_URL }}
          >
            {t('signup.githubStart')}
          </Button>

          <div className="w-full flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-line" />
            <span className="text-[13px] text-ink-muted">{t('signup.or')}</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          <form className="w-full flex flex-col gap-4" onSubmit={onSubmit}>
            <Input label={t('signup.emailLabel')} type="email" leftIcon="mail" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label={t('signup.passwordLabel')} reveal leftIcon="lock" placeholder={t('signup.passwordPlaceholder')} value={pw} onChange={(e) => setPw(e.target.value)} />
            <Input label={t('signup.passwordConfirmLabel')} reveal leftIcon="lock" placeholder={t('signup.passwordConfirmPlaceholder')} value={pw2} onChange={(e) => setPw2(e.target.value)} />

            <div className="rounded-xl bg-surface border border-line px-4 py-3.5 flex flex-col gap-3">
              <Checkbox label={t('signup.terms.agreeAll')} checked={allChecked} onChange={toggleAll} bold />
              <div className="h-px bg-line" />
              {TERMS.map((term) => (
                <Checkbox key={term.key} label={t(term.labelKey)} checked={!!checked[term.key]} onChange={() => toggle(term.key)} />
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-danger text-[13px]">
                <Icon name="alert-circle" size={16} /> {error}
              </div>
            )}

            <Button type="submit" size="lg" block loading={loading}>{t('signup.submit')}</Button>
          </form>

          <p className="mt-5 text-sm text-ink-muted">
            {t('signup.haveAccount')}{' '}
            <button onClick={() => navigate('/login')} className="text-brand font-semibold hover:underline">{t('signup.loginLink')}</button>
          </p>
        </div>
      </main>
    </div>
  )
}

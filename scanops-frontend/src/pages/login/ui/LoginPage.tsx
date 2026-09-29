import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Logo from '../../../shared/ui/Logo'
import Input from '../../../shared/ui/Input'
import Button from '../../../shared/ui/Button'
import Icon from '../../../shared/ui/Icon'
import LanguageSwitcher from '../../../shared/ui/LanguageSwitcher'
import { useAuth } from '../../../shared/lib/auth'
import { GITHUB_AUTHORIZE_URL } from '../../../shared/lib/config'

export default function LoginPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  // 백엔드 OAuth 실패 시 ?error=메시지 로 리다이렉트됨 → 표시
  const [error, setError] = useState(() => new URLSearchParams(location.search).get('error') ?? '')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) return setError(t('login.errors.missingFields'))
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.errors.loginFailed'))
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

      <main className="flex-1 flex items-start justify-center px-6">
        <div className="w-full max-w-[400px] mt-12 sm:mt-16 flex flex-col items-center fade-up">
          <h1 className="text-[26px] font-bold text-ink tracking-tight">{t('login.title')}</h1>
          <p className="mt-1.5 text-[15px] text-ink-muted">{t('login.subtitle')}</p>

          <Button
            variant="github"
            size="lg"
            block
            leftIcon="github"
            className="mt-8"
            onClick={() => { window.location.href = GITHUB_AUTHORIZE_URL }}
          >
            {t('login.githubContinue')}
          </Button>

          <div className="w-full flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-line" />
            <span className="text-[13px] text-ink-muted">{t('login.orEmail')}</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          <form className="w-full flex flex-col gap-4" onSubmit={onSubmit}>
            <Input label={t('login.emailLabel')} type="email" leftIcon="mail" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label={t('login.passwordLabel')} reveal leftIcon="lock" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />

            <button type="button" className="self-end -mt-1 text-[13px] text-ink-muted font-medium hover:text-ink-sub">
              {t('login.forgotPassword')}
            </button>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-danger text-[13px]">
                <Icon name="alert-circle" size={16} /> {error}
              </div>
            )}

            <Button type="submit" size="lg" block loading={loading}>{t('login.submit')}</Button>
          </form>

          <p className="mt-6 text-sm text-ink-muted">
            {t('login.noAccount')}{' '}
            <button onClick={() => navigate('/signup')} className="text-brand font-semibold hover:underline">{t('login.signupLink')}</button>
          </p>
        </div>
      </main>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Logo from '../../../shared/ui/Logo'
import Icon from '../../../shared/ui/Icon'
import { useAuth } from '../../../shared/lib/auth'

/**
 * GitHub OAuth 콜백. 백엔드가 로그인/연동 성공 시 `?token=<jwt>`를 붙여 이 경로로
 * 리다이렉트한다. 여기서 토큰을 저장하고 프로필을 불러온 뒤 대시보드로 이동한다.
 */
export default function GitHubCallbackPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const location = useLocation()
  const { loginWithToken } = useAuth()
  const [phase, setPhase] = useState<'connecting' | 'done' | 'error'>('connecting')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const token = new URLSearchParams(location.search).get('token')
    if (!token) { setPhase('error'); return }
    loginWithToken(token)
      .then(() => {
        setPhase('done')
        setTimeout(() => navigate('/dashboard', { replace: true }), 650)
      })
      .catch(() => setPhase('error'))
  }, [loginWithToken, navigate, location.search])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="h-18 flex items-center px-6 sm:px-10 py-5">
        <Logo />
      </header>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="flex flex-col items-center text-center fade-up">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-12 h-12 rounded-2xl bg-ink text-white flex items-center justify-center">
              <Icon name="github" size={24} />
            </span>
            <Icon name={phase === 'error' ? 'x' : 'arrow-right'} size={18} className="text-ink-faint" />
            <span className="w-12 h-12 rounded-2xl bg-brand-soft text-brand flex items-center justify-center">
              <Icon name="shield" size={24} />
            </span>
          </div>
          {phase === 'connecting' && (
            <>
              <div className="flex items-center gap-2.5 text-ink">
                <span className="w-5 h-5 rounded-full border-2 border-line border-t-brand spin" />
                <p className="text-[17px] font-semibold">{t('callback.connecting')}</p>
              </div>
              <p className="mt-2 text-sm text-ink-muted">{t('callback.connectingDesc')}</p>
            </>
          )}
          {phase === 'done' && (
            <>
              <p className="text-[17px] font-semibold text-ink flex items-center gap-2">
                <span className="text-success"><Icon name="check-circle" size={20} /></span> {t('callback.done')}
              </p>
              <p className="mt-2 text-sm text-ink-muted">{t('callback.doneDesc')}</p>
            </>
          )}
          {phase === 'error' && (
            <>
              <p className="text-[17px] font-semibold text-ink">{t('callback.error')}</p>
              <button onClick={() => navigate('/login')} className="mt-4 text-brand font-semibold text-sm hover:underline">
                {t('callback.retry')}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

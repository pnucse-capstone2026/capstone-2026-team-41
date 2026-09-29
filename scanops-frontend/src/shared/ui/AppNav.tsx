import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Logo from './Logo'
import Icon, { type IconName } from './Icon'
import Avatar from './Avatar'
import LanguageSwitcher from './LanguageSwitcher'
import { useAuth } from '../lib/auth'
import { planById } from '../lib/mock'
import { ENABLE_PRICING } from '../lib/config'
import { useTour } from '../lib/tour'

interface NavItem { key: string; path: string; icon: IconName; match: (p: string) => boolean; tourId?: string }

const ITEMS: NavItem[] = [
  { key: 'dashboard', path: '/dashboard', icon: 'home', match: (p) => p.startsWith('/dashboard') },
  { key: 'scan', path: '/scan', icon: 'target', match: (p) => p === '/scan' || /^\/scan\//.test(p) },
  { key: 'scanHistory', path: '/reports', icon: 'file-text', match: (p) => p.startsWith('/reports') || p.startsWith('/report/') },
  { key: 'integrations', path: '/integrations', icon: 'github', match: (p) => p.startsWith('/integrations'), tourId: 'nav-integrations' },
  ...(ENABLE_PRICING ? [{ key: 'pricing', path: '/pricing', icon: 'credit-card' as IconName, match: (p: string) => p.startsWith('/pricing'), tourId: 'nav-pricing' }] : []),
]

/** Shared top navigation for authenticated app screens (V3 light theme). */
export default function AppNav() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const { restart } = useTour()
  const [menu, setMenu] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const plan = user ? planById(user.plan) : null

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between h-16 px-5 sm:px-8 bg-white/90 backdrop-blur border-b border-line">
      <div className="flex items-center gap-7">
        <Logo size={18} onClick={() => navigate('/dashboard')} />
        <div className="hidden md:flex items-center gap-1">
          {ITEMS.map((it) => {
            const active = it.match(pathname)
            return (
              <button
                key={it.path}
                data-tour={it.tourId}
                onClick={() => navigate(it.path)}
                className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-[13.5px] transition-colors ${
                  active ? 'text-ink font-semibold bg-field' : 'text-ink-muted font-medium hover:text-ink-sub hover:bg-surface'
                }`}
              >
                <Icon name={it.icon} size={16} />
                {t(`nav.${it.key}`)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <LanguageSwitcher />
        <button
          onClick={() => navigate('/scan')}
          className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-white text-[13px] font-semibold hover:bg-brand-hover transition-colors"
        >
          <Icon name="plus" size={15} /> {t('newScan')}
        </button>
        {ENABLE_PRICING && plan && (
          <button
            onClick={() => navigate('/pricing')}
            className="px-2.5 py-1.5 rounded-full bg-brand-soft text-brand text-xs font-bold hover:bg-[#dceafe] transition-colors"
          >
            {plan.name}
          </button>
        )}

        <div className="relative" ref={ref}>
          <button data-tour="nav-avatar" onClick={() => setMenu((m) => !m)} className="flex items-center" aria-label={t('accountMenu')}>
            <Avatar name={user?.name} size={32} />
          </button>
          {menu && (
            <div className="fade-up absolute right-0 mt-2 w-56 bg-white rounded-xl border border-line shadow-[0px_8px_24px_rgba(0,0,0,0.12)] overflow-hidden">
              <div className="px-4 py-3 border-b border-line">
                <p className="text-sm font-semibold text-ink truncate">{user?.name}</p>
                <p className="text-[12px] text-ink-muted truncate">{user?.email}</p>
              </div>
              <MenuItem icon="user" label={t('menu.mypage')} onClick={() => { setMenu(false); navigate('/mypage') }} />
              <MenuItem icon="settings" label={t('menu.settings')} onClick={() => { setMenu(false); navigate('/settings') }} />
              {ENABLE_PRICING && (
                <MenuItem icon="credit-card" label={t('menu.billing')} onClick={() => { setMenu(false); navigate('/pricing') }} />
              )}
              <div className="h-px bg-line" />
              <MenuItem icon="compass" label={t('menu.restartTour')} onClick={() => { setMenu(false); restart() }} />
              <MenuItem icon="log-out" label={t('menu.logout')} danger onClick={() => { setMenu(false); logout(); navigate('/') }} />
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

function MenuItem({ icon, label, onClick, danger }: { icon: IconName; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] font-medium transition-colors hover:bg-surface ${
        danger ? 'text-danger' : 'text-ink-sub'
      }`}
    >
      <Icon name={icon} size={16} />
      {label}
    </button>
  )
}

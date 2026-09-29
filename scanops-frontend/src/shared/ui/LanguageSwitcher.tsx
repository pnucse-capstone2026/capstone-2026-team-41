import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../lib/i18n'

/** Manual language toggle (KO/EN). Browser language is auto-detected on first visit; the pick persists in localStorage. */
export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { i18n } = useTranslation()
  const current = (i18n.resolvedLanguage ?? 'ko') as SupportedLanguage

  return (
    <div className={`inline-flex items-center rounded-full bg-field p-0.5 ${className}`}>
      {SUPPORTED_LANGUAGES.map((lng) => (
        <button
          key={lng}
          onClick={() => i18n.changeLanguage(lng)}
          aria-pressed={current === lng}
          className={`px-2.5 h-6 rounded-full text-[11px] font-bold uppercase transition-colors ${
            current === lng ? 'bg-white text-brand shadow-sm' : 'text-ink-muted hover:text-ink-sub'
          }`}
        >
          {lng}
        </button>
      ))}
    </div>
  )
}

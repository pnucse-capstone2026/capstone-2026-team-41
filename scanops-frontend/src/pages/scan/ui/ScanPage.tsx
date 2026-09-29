import { useTranslation } from 'react-i18next'
import AppNav from '../../../shared/ui/AppNav'
import ScanForm from '../../../features/scan-request/ui/ScanForm'

export default function ScanPage() {
  const { t } = useTranslation('scan')
  return (
    <div className="min-h-screen bg-surface">
      <AppNav />

      <main className="max-w-[760px] mx-auto px-6 py-10">
        <h1 className="text-[28px] font-bold text-ink tracking-tight">{t('scanPage.title')}</h1>
        <p className="mt-1.5 text-[15px] text-ink-muted">
          {t('scanPage.subtitle')}
        </p>
        <div className="mt-7">
          <ScanForm />
        </div>
      </main>
    </div>
  )
}

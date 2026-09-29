import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AppNav from '../../../shared/ui/AppNav'
import Card from '../../../shared/ui/Card'
import Button from '../../../shared/ui/Button'
import Input from '../../../shared/ui/Input'
import Badge from '../../../shared/ui/Badge'
import Toggle from '../../../shared/ui/Toggle'
import Modal from '../../../shared/ui/Modal'
import Icon, { type IconName } from '../../../shared/ui/Icon'
import { useAuth } from '../../../shared/lib/auth'
import { useToast } from '../../../shared/ui/Toast'
import { won } from '../../../shared/lib/mock'
import { usePlanText } from '../../../shared/lib/planText'

type Tab = 'account' | 'security' | 'notifications' | 'billing' | 'danger'
const TAB_ICONS: Record<Tab, IconName> = {
  account: 'user',
  security: 'lock',
  notifications: 'bell',
  billing: 'credit-card',
  danger: 'alert-triangle',
}
const TAB_IDS: Tab[] = ['account', 'security', 'notifications', 'billing', 'danger']

export default function SettingsPage() {
  const { t } = useTranslation('settings')
  const navigate = useNavigate()
  const { user, update, logout } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('account')
  const [name, setName] = useState(user?.name ?? '')
  const [notif, setNotif] = useState({ scanDone: true, weekly: true, marketing: false, criticalOnly: false })
  const [delOpen, setDelOpen] = useState(false)
  const plan = usePlanText(user?.plan ?? 'FREE')
  if (!user) return null

  return (
    <div className="min-h-screen bg-surface">
      <AppNav />
      <main className="max-w-[900px] mx-auto px-6 py-8 fade-up">
        <h1 className="text-[26px] font-bold text-ink tracking-tight">{t('title')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5 mt-5">
          {/* tabs */}
          <nav className="flex md:flex-col gap-1 overflow-x-auto">
            {TAB_IDS.map((id) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2.5 px-3.5 h-10 rounded-xl text-[13.5px] font-medium whitespace-nowrap transition-colors ${
                  tab === id ? 'bg-white border border-line text-ink font-semibold shadow-[0px_1px_3px_rgba(0,0,0,0.05)]'
                    : 'text-ink-muted hover:text-ink-sub hover:bg-white/60'
                } ${id === 'danger' ? 'text-danger' : ''}`}>
                <Icon name={TAB_ICONS[id]} size={16} /> {t(`tabs.${id}`)}
              </button>
            ))}
          </nav>

          {/* panel */}
          <div className="min-w-0">
            {tab === 'account' && (
              <Card pad="lg">
                <h2 className="text-[17px] font-bold text-ink mb-4">{t('account.title')}</h2>
                <div className="flex flex-col gap-4 max-w-[420px]">
                  <Input label={t('account.name')} value={name} onChange={(e) => setName(e.target.value)} />
                  <Input label={t('account.email')} value={user.email} disabled hint={t('account.emailHint')} />
                  <Button className="self-start" onClick={() => { update({ name }); toast(t('account.saved'), 'success') }}>{t('account.save')}</Button>
                </div>
              </Card>
            )}

            {tab === 'security' && (
              <div className="flex flex-col gap-4">
                <Card pad="lg">
                  <h2 className="text-[17px] font-bold text-ink mb-4">{t('security.passwordTitle')}</h2>
                  <div className="flex flex-col gap-4 max-w-[420px]">
                    <Input label={t('security.currentPassword')} reveal placeholder="••••••••" />
                    <Input label={t('security.newPassword')} reveal placeholder={t('security.newPasswordPlaceholder')} />
                    <Button className="self-start" onClick={() => toast(t('security.passwordChanged'), 'success')}>{t('security.changePassword')}</Button>
                  </div>
                </Card>
                <Card pad="lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-ink text-white flex items-center justify-center"><Icon name="github" size={20} /></span>
                      <div>
                        <p className="text-[14.5px] font-semibold text-ink">{t('security.githubTitle')}</p>
                        <p className="text-[12.5px] text-ink-muted">{user.githubLogin ? t('security.githubConnected', { login: user.githubLogin }) : t('security.githubNotConnected')}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/integrations')}>{t('security.manage')}</Button>
                  </div>
                </Card>
              </div>
            )}

            {tab === 'notifications' && (
              <Card pad="lg">
                <h2 className="text-[17px] font-bold text-ink mb-1">{t('notifications.title')}</h2>
                <p className="text-[13px] text-ink-muted mb-4">{t('notifications.subtitle')}</p>
                <div className="flex flex-col divide-y divide-line">
                  <NotifRow label={t('notifications.scanDone.label')} sub={t('notifications.scanDone.sub')} v={notif.scanDone} on={(x) => setNotif((n) => ({ ...n, scanDone: x }))} />
                  <NotifRow label={t('notifications.criticalOnly.label')} sub={t('notifications.criticalOnly.sub')} v={notif.criticalOnly} on={(x) => setNotif((n) => ({ ...n, criticalOnly: x }))} />
                  <NotifRow label={t('notifications.weekly.label')} sub={t('notifications.weekly.sub')} v={notif.weekly} on={(x) => setNotif((n) => ({ ...n, weekly: x }))} />
                  <NotifRow label={t('notifications.marketing.label')} sub={t('notifications.marketing.sub')} v={notif.marketing} on={(x) => setNotif((n) => ({ ...n, marketing: x }))} />
                </div>
              </Card>
            )}

            {tab === 'billing' && (
              <div className="flex flex-col gap-4">
                <Card pad="lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2"><h2 className="text-[17px] font-bold text-ink">{plan.name} {t('billing.planSuffix')}</h2><Badge tone="brand" size="sm">{t('billing.currentPlan')}</Badge></div>
                      <p className="mt-0.5 text-[13px] text-ink-muted">{plan.price === 0 ? t('billing.free') : `${won(plan.price)}${plan.per}`}</p>
                    </div>
                    <Button size="sm" onClick={() => navigate('/pricing')}>{t('billing.change')}</Button>
                  </div>
                </Card>
                <Card pad="lg">
                  <div className="flex items-center justify-between mb-3"><h3 className="text-[15px] font-bold text-ink">{t('billing.paymentMethodTitle')}</h3><Button variant="outline" size="sm" leftIcon="plus" onClick={() => toast(t('billing.addToast'))}>{t('billing.add')}</Button></div>
                  <div className="flex items-center gap-3 rounded-xl bg-surface border border-line px-4 py-3">
                    <Icon name="credit-card" size={20} className="text-ink-sub" />
                    <p className="text-[13.5px] text-ink-sub">{t('billing.noPaymentMethod')}</p>
                  </div>
                </Card>
                <Card pad="lg">
                  <h3 className="text-[15px] font-bold text-ink mb-3">{t('billing.receiptsTitle')}</h3>
                  <p className="text-[13px] text-ink-muted">{t('billing.noReceipts')}</p>
                </Card>
              </div>
            )}

            {tab === 'danger' && (
              <Card pad="lg" className="border-danger-soft">
                <h2 className="text-[17px] font-bold text-danger mb-1">{t('danger.title')}</h2>
                <p className="text-[13px] text-ink-muted mb-4">{t('danger.subtitle')}</p>
                <div className="flex items-center justify-between rounded-xl border border-danger-soft bg-danger-soft/40 px-4 py-3.5">
                  <div>
                    <p className="text-[14px] font-semibold text-ink">{t('danger.deleteAccount')}</p>
                    <p className="text-[12.5px] text-ink-muted">{t('danger.deleteAccountDesc')}</p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => setDelOpen(true)}>{t('danger.deleteAccount')}</Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Modal
        open={delOpen}
        onClose={() => setDelOpen(false)}
        title={t('deleteModal.title')}
        footer={
          <>
            <Button variant="ghost" block onClick={() => setDelOpen(false)}>{t('deleteModal.cancel')}</Button>
            <Button variant="danger" block onClick={() => { logout(); navigate('/') }}>{t('deleteModal.confirm')}</Button>
          </>
        }
      >
        <p className="text-[14px] text-ink-sub leading-relaxed">
          {t('deleteModal.body')}
        </p>
      </Modal>
    </div>
  )
}

function NotifRow({ label, sub, v, on }: { label: string; sub: string; v: boolean; on: (x: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <div><p className="text-[14px] font-medium text-ink">{label}</p><p className="text-[12.5px] text-ink-muted">{sub}</p></div>
      <Toggle checked={v} onChange={on} />
    </div>
  )
}

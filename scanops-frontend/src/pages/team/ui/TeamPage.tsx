import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AppNav from '../../../shared/ui/AppNav'
import Card from '../../../shared/ui/Card'
import Button from '../../../shared/ui/Button'
import Badge from '../../../shared/ui/Badge'
import Avatar from '../../../shared/ui/Avatar'
import Input from '../../../shared/ui/Input'
import Modal from '../../../shared/ui/Modal'
import Icon from '../../../shared/ui/Icon'
import { useToast } from '../../../shared/ui/Toast'
import { fetchTeam, type TeamMember } from '../../../shared/lib/mock'

const ROLE_TONE: Record<TeamMember['role'], 'brand' | 'purple' | 'neutral'> = {
  OWNER: 'brand',
  ADMIN: 'purple',
  MEMBER: 'neutral',
}

export default function TeamPage() {
  const { t } = useTranslation('team')
  const { toast } = useToast()
  const [team, setTeam] = useState<TeamMember[] | null>(null)
  const [invite, setInvite] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => { fetchTeam().then(setTeam) }, [])

  const active = team?.filter((m) => m.status === 'ACTIVE').length ?? 0
  const seats = 3

  const sendInvite = () => {
    if (!email.includes('@')) return toast(t('invalidEmail'), 'danger')
    setTeam((prev) => [...(prev ?? []), { id: 'inv-' + Date.now(), name: email.split('@')[0], email, role: 'MEMBER', status: 'INVITED' }])
    setInvite(false); setEmail('')
    toast(t('invited'), 'success')
  }

  return (
    <div className="min-h-screen bg-surface">
      <AppNav />
      <main className="max-w-[820px] mx-auto px-6 py-8 fade-up">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-[26px] font-bold text-ink tracking-tight">{t('title')}</h1>
            <p className="mt-1 text-sm text-ink-muted">{t('subtitle')}</p>
          </div>
          <Button leftIcon="plus" onClick={() => setInvite(true)}>{t('invite')}</Button>
        </div>

        <Card pad="lg" className="mb-4">
          <div className="flex items-center gap-6">
            <div><p className="text-[26px] font-bold text-ink tnum leading-none">{active}<span className="text-[15px] text-ink-muted font-medium"> / {seats}</span></p><p className="mt-1 text-[12.5px] text-ink-muted">{t('seatsUsed')}</p></div>
            <div className="w-px h-9 bg-line" />
            <p className="text-[13px] text-ink-sub flex items-center gap-1.5"><Icon name="info" size={15} className="text-ink-muted" /> {t('seatsInfo')}</p>
          </div>
        </Card>

        {!team ? (
          <div className="flex flex-col gap-2.5">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-2xl skeleton" />)}</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {team.map((m) => (
              <Card key={m.id} pad="none" className="px-[18px] py-3.5 flex items-center gap-3.5">
                <Avatar name={m.name} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-ink">{m.name}</p>
                  <p className="text-[12.5px] text-ink-muted">{m.email}</p>
                </div>
                {m.status === 'INVITED' && <Badge tone="warning" size="sm">{t('status.INVITED')}</Badge>}
                <Badge tone={ROLE_TONE[m.role]} size="sm">{t(`role.${m.role}`)}</Badge>
                {m.role !== 'OWNER' && (
                  <button onClick={() => { setTeam((prev) => prev!.filter((x) => x.id !== m.id)); toast(t('removed')) }} className="text-ink-faint hover:text-danger transition-colors" aria-label={t('remove')}>
                    <Icon name="x" size={18} />
                  </button>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>

      <Modal open={invite} onClose={() => setInvite(false)} title={t('inviteModal.title')}
        footer={<><Button variant="ghost" block onClick={() => setInvite(false)}>{t('inviteModal.cancel')}</Button><Button block onClick={sendInvite}>{t('inviteModal.send')}</Button></>}>
        <p className="text-[13.5px] text-ink-muted mb-3">{t('inviteModal.desc')}</p>
        <Input label={t('inviteModal.emailLabel')} leftIcon="mail" placeholder="member@team.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Modal>
    </div>
  )
}

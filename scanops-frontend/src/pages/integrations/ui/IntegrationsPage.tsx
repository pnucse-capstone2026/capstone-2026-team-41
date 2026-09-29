import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AppNav from '../../../shared/ui/AppNav'
import Card from '../../../shared/ui/Card'
import Button from '../../../shared/ui/Button'
import Badge from '../../../shared/ui/Badge'
import Icon from '../../../shared/ui/Icon'
import { useAuth, getToken } from '../../../shared/lib/auth'
import { useToast } from '../../../shared/ui/Toast'
import { relativeTime } from '../../../shared/lib/mock'
import { fetchMyGithubRepos, type MyGithubRepo } from '../../../shared/api/scan'
import { GITHUB_APP_INSTALL_URL, githubLinkUrl } from '../../../shared/lib/config'

export default function IntegrationsPage() {
  const { t } = useTranslation('integrations')
  const navigate = useNavigate()
  const { user, update } = useAuth()
  const { toast } = useToast()
  const [repos, setRepos] = useState<MyGithubRepo[] | null>(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const connected = !!user?.githubLogin

  // 실제 GitHub OAuth 연동 — 현재(이메일) 계정에 GitHub을 붙인다(같은 계정).
  const connectGithub = () => {
    const token = getToken()
    if (!token) { toast(t('githubAccount.loginRequired')); return }
    window.location.href = githubLinkUrl(token)
  }

  useEffect(() => {
    if (!connected) { setRepos(null); return }
    let alive = true
    setRepos(null)
    setError('')
    fetchMyGithubRepos()
      .then((r) => { if (alive) setRepos(r) })
      .catch(() => { if (alive) setError(t('repos.fetchError')) })
    return () => { alive = false }
  }, [connected, user?.githubLogin])

  const filtered = repos?.filter((r) => r.fullName.toLowerCase().includes(q.toLowerCase()))

  const scanRepo = (r: MyGithubRepo) =>
    navigate('/scan', { state: { mode: 'GITHUB_REPO', target: r.htmlUrl ?? `https://github.com/${r.fullName}` } })

  return (
    <div className="min-h-screen bg-surface">
      <AppNav />
      <main className="max-w-[820px] mx-auto px-6 py-8 fade-up">
        <h1 className="text-[26px] font-bold text-ink tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t('subtitle')}</p>

        {/* GitHub account */}
        <Card pad="lg" className="mt-6">
          <div className="flex items-center gap-3.5">
            <span className="w-12 h-12 rounded-2xl bg-ink text-white flex items-center justify-center shrink-0"><Icon name="github" size={24} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-ink">{t('githubAccount.title')}</p>
              <p className="text-[13px] text-ink-muted">{connected ? t('githubAccount.connectedAs', { login: user?.githubLogin }) : t('githubAccount.notConnected')}</p>
            </div>
            {connected ? (
              <div className="flex items-center gap-2">
                <Badge tone="success"><Icon name="check" size={12} strokeWidth={3} /> {t('githubAccount.connected')}</Badge>
                <Button variant="ghost" size="sm" onClick={() => { update({ githubLogin: null }); toast(t('githubAccount.disconnected')) }}>{t('githubAccount.disconnect')}</Button>
              </div>
            ) : (
              <Button variant="dark" size="sm" leftIcon="github" onClick={connectGithub}>{t('githubAccount.connect')}</Button>
            )}
          </div>
        </Card>

        {/* App install */}
        <Card pad="lg" className="mt-4">
          <div className="flex items-start gap-3.5">
            <span className="w-12 h-12 rounded-2xl bg-success-soft text-success flex items-center justify-center shrink-0"><Icon name="git-pull-request" size={24} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[15px] font-bold text-ink">{t('app.title')}</p>
                <Badge tone="brand" size="sm">{t('app.badge')}</Badge>
              </div>
              <p className="text-[13px] text-ink-muted mt-0.5">{t('app.desc')}</p>
              <p className="text-[12px] text-ink-muted mt-1.5 leading-relaxed">
                <span className="font-semibold text-ink-sub">{t('app.privateNote')}</span> {t('app.installScreen')}
                <b className="mx-1">{t('app.onlySelectRepos')}</b>{t('app.privateNoteRest')}
              </p>
            </div>
            <Button variant="outline" size="sm" rightIcon="external-link" onClick={() => window.open(GITHUB_APP_INSTALL_URL, '_blank', 'noopener')}>{t('app.install')}</Button>
          </div>
        </Card>

        {/* Repositories */}
        <div className="flex items-center justify-between mt-8 mb-3">
          <div>
            <h2 className="text-[17px] font-bold text-ink">{t('repos.title')}</h2>
            <p className="text-[12.5px] text-ink-muted mt-0.5">{t('repos.subtitle')}</p>
          </div>
          {connected && repos && repos.length > 0 && (
            <div className="relative w-[220px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"><Icon name="search" size={16} /></span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('repos.searchPlaceholder')}
                className="w-full h-9 rounded-lg bg-white border border-line pl-9 pr-3 text-[13.5px] outline-none focus:border-brand transition-colors" />
            </div>
          )}
        </div>

        {!connected ? (
          <Card pad="lg" className="text-center py-12">
            <span className="inline-flex w-14 h-14 rounded-2xl bg-field text-ink-muted items-center justify-center mb-3"><Icon name="github" size={26} /></span>
            <p className="text-sm text-ink-muted">{t('repos.emptyNotConnected')}</p>
          </Card>
        ) : error ? (
          <Card pad="lg" className="text-center py-12">
            <span className="inline-flex w-14 h-14 rounded-2xl bg-danger-soft text-danger items-center justify-center mb-3"><Icon name="alert-triangle" size={26} /></span>
            <p className="text-sm text-ink-muted">{error}</p>
          </Card>
        ) : !filtered ? (
          <div className="flex flex-col gap-2.5">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-2xl skeleton" />)}</div>
        ) : filtered.length === 0 ? (
          <Card pad="lg" className="text-center py-12">
            <span className="inline-flex w-14 h-14 rounded-2xl bg-field text-ink-muted items-center justify-center mb-3"><Icon name="box" size={26} /></span>
            <p className="text-sm text-ink-muted">{q ? t('repos.emptySearch') : t('repos.emptyOwned')}</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((r) => (
              <Card key={r.id} pad="none" className="px-[18px] py-3.5 flex items-center gap-3.5">
                <span className="w-9 h-9 rounded-xl bg-field text-ink-sub flex items-center justify-center shrink-0"><Icon name="box" size={18} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold text-ink truncate">{r.fullName}</p>
                    {r.private ? <Icon name="lock" size={13} className="text-ink-faint" /> : <Badge tone="neutral" size="sm">public</Badge>}
                  </div>
                  <p className="text-[12px] text-ink-muted">
                    {r.language ? `${r.language} · ` : ''}{r.defaultBranch}
                    {r.pushedAt ? ` · ${relativeTime(r.pushedAt)} ${t('repos.updatedAt')}` : ''}
                  </p>
                </div>
                <Button size="sm" variant="weak" leftIcon="target" onClick={() => scanRepo(r)}>{t('repos.scan')}</Button>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

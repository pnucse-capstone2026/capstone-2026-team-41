import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from '../../../shared/ui/Icon'
import Button from '../../../shared/ui/Button'
import Card from '../../../shared/ui/Card'
import Badge from '../../../shared/ui/Badge'
import { useToast } from '../../../shared/ui/Toast'
import { MODE_META, type ScanMode } from '../../../shared/lib/mock'
import { useModeLabel } from '../../../shared/lib/planText'
import { useAuth } from '../../../shared/lib/auth'
import { initDomainVerify, confirmDomainVerify, type DomainVerifyInit } from '../../../shared/api/verify'
import { createWebsiteScan, createRepoScan } from '../../../shared/api/scan'
import { fetchWallet, type TokenWallet } from '../../../shared/api/tokens'

const ORDER: ScanMode[] = ['WEBSITE', 'GITHUB_REPO', 'GITHUB_ACTIONS']

type VState = 'idle' | 'unverified' | 'pending' | 'checking' | 'verified'

const extractOwner = (repo: string): string | null => {
  const m = repo.trim().match(/github\.com\/([^/]+)\/([^/\s]+)/) ?? repo.trim().match(/^([\w.-]+)\/([\w.-]+)$/)
  return m ? m[1] : null
}

// 백엔드 scanops.dast.self-scan-domain 기본값과 동일 — ScanOps 자체 서비스는 소유권 인증을 생략한다.
const SELF_SCAN_DOMAIN = (import.meta.env.VITE_SELF_SCAN_DOMAIN as string | undefined) ?? 'scanops-frontend.vercel.app'

const isSelfScanDomain = (url: string): boolean => {
  try {
    return new URL(url).hostname.toLowerCase() === SELF_SCAN_DOMAIN.toLowerCase()
  } catch {
    return false
  }
}

export default function ScanForm() {
  const { t } = useTranslation('scan')
  const navigate = useNavigate()
  const location = useLocation()
  // 연동 페이지 등에서 레포/모드를 넘겨주면 미리 채운다.
  const prefill = location.state as { mode?: ScanMode; target?: string } | null
  const { user } = useAuth()
  const { toast } = useToast()
  // ORDER는 고정된 3개 모드이므로 훅을 반복문 없이 각각 호출해도 안전하다.
  const modeLabels: Record<ScanMode, string> = {
    WEBSITE: useModeLabel('WEBSITE'),
    GITHUB_REPO: useModeLabel('GITHUB_REPO'),
    GITHUB_ACTIONS: useModeLabel('GITHUB_ACTIONS'),
  }
  const [mode, setMode] = useState<ScanMode>(prefill?.mode ?? 'WEBSITE')
  const [target, setTarget] = useState(prefill?.target ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [wallet, setWallet] = useState<TokenWallet | null>(null)

  useEffect(() => { fetchWallet().then(setWallet).catch(() => setWallet(null)) }, [])

  // 도메인 인증 상태 (WEBSITE)
  const [vstate, setVstate] = useState<VState>('idle')
  const [vinfo, setVinfo] = useState<DomainVerifyInit | null>(null)

  const isActions = mode === 'GITHUB_ACTIONS'
  const isRepo = mode === 'GITHUB_REPO'
  const ghConnected = !!user?.githubLogin

  const validUrl = /^https?:\/\/.+\..+/.test(target)
  // URL이 바뀌면 인증 상태 초기화 — 단, ScanOps 자체 도메인은 바로 인증된 것으로 처리
  useEffect(() => {
    setVinfo(null)
    if (!validUrl) return setVstate('idle')
    setVstate(isSelfScanDomain(target) ? 'verified' : 'unverified')
  }, [target, validUrl])

  // GitHub 레포 소유 여부 (내 계정 소유면 인증된 것으로 간주)
  const repoOwner = useMemo(() => (isRepo ? extractOwner(target) : null), [isRepo, target])
  const repoOwned = isRepo && ghConnected && !!repoOwner &&
    repoOwner.toLowerCase() === (user?.githubLogin ?? '').toLowerCase()

  const startVerify = async () => {
    setError('')
    setVstate('pending')
    try {
      const info = await initDomainVerify(target)
      setVinfo(info)
      if (info.verified) setVstate('verified')
    } catch {
      setError(t('scanForm.errors.verifyStartFailed'))
      setVstate('unverified')
    }
  }

  const checkVerify = async () => {
    setError('')
    setVstate('checking')
    try {
      const res = await confirmDomainVerify(target)
      if (res.verified) {
        setVstate('verified')
        toast(t('scanForm.toast.domainVerified'), 'success')
      } else {
        setVstate('pending')
        setError(t('scanForm.errors.fileNotFound'))
      }
    } catch {
      setVstate('pending')
      setError(t('scanForm.errors.checkFailed'))
    }
  }

  const noDastLeft = !isRepo && wallet != null && wallet.dastAvailable <= 0
  const noSastLeft = isRepo && wallet != null && wallet.sourceLinesLeft <= 0
  const canScan = (isRepo ? repoOwned : vstate === 'verified') && !noDastLeft && !noSastLeft

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!canScan) {
      if (noDastLeft) return setError(t('scanForm.errors.noDastLeft'))
      if (noSastLeft) return setError(t('scanForm.errors.noSastLeft'))
      return setError(isRepo ? t('scanForm.errors.repoOwnershipRequired') : t('scanForm.errors.domainVerifyRequired'))
    }
    setLoading(true)
    try {
      if (mode === 'WEBSITE') {
        // DAST는 실제 백엔드(ZAP) 스캔
        const job = await createWebsiteScan(target, email || user?.email || 'noreply@scanops.io')
        navigate(`/scan/${job.scanId}/status`, { state: { target, mode } })
      } else {
        // SAST(레포)도 실제 백엔드(QLoRA 모델) 스캔
        const job = await createRepoScan(target, email || user?.email || 'noreply@scanops.io')
        navigate(`/scan/${job.scanId}/status`, { state: { target, mode } })
      }
    } catch (err) {
      // 동시 스캔 한도 초과(429), 잔액 부족(402) 등은 백엔드가 구체적인 사유를 내려준다 —
      // 뭉뚱그리지 않고 그대로 보여줘야 "왜 실패했는지" 사용자가 알 수 있다.
      setError(err instanceof Error ? err.message : t('scanForm.errors.scanRequestFailed'))
    } finally {
      setLoading(false)
    }
  }

  const copy = (text: string) => { navigator.clipboard?.writeText(text); toast(t('scanForm.toast.copied'), 'success') }

  return (
    <div className="w-full">
      {/* Mode cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {ORDER.map((id) => {
          const m = MODE_META[id]
          const selected = mode === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => { setMode(id); setTarget(''); setError('') }}
              className="rounded-2xl p-[18px] text-left bg-white transition-all"
              style={{ background: selected ? m.soft : '#fff', border: `${selected ? 2 : 1}px solid ${selected ? m.color : 'var(--color-line)'}` }}
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: selected ? '#fff' : 'var(--color-field)', color: m.color }}>
                  <Icon name={m.icon} size={19} />
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: selected ? m.color : 'var(--color-field)', color: selected ? '#fff' : 'var(--color-ink-muted)' }}>
                  {m.tag}
                </span>
              </div>
              <p className="text-[15px] font-bold text-ink">{modeLabels[id]}</p>
              <p className="text-[12.5px] text-ink-muted mt-0.5">{t(`scanForm.modeSub.${id}`)}</p>
            </button>
          )
        })}
      </div>

      <Card pad="lg">
        {isActions ? (
          <div className="text-center py-3">
            <span className="inline-flex w-12 h-12 rounded-2xl bg-success-soft text-success items-center justify-center mb-3"><Icon name="git-pull-request" size={24} /></span>
            <p className="text-[15px] text-ink-sub leading-relaxed mb-1">{t('scanForm.actions.description')}</p>
            <p className="text-[13px] text-ink-muted mb-5">{t('scanForm.actions.subDescription')}</p>
            <Button variant="dark" leftIcon="github" onClick={() => navigate('/integrations')}>{t('scanForm.actions.installButton')}</Button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label className="block text-[13px] font-medium text-ink-sub mb-2">{isRepo ? t('scanForm.labels.repo') : t('scanForm.labels.targetUrl')}</label>

            {isRepo && !ghConnected ? (
              <div className="rounded-xl bg-warning-soft px-4 py-3.5 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[13.5px] text-[#9a5b00]"><Icon name="alert-triangle" size={16} /> {t('scanForm.github.notConnected')}</span>
                <Button size="sm" variant="dark" leftIcon="github" onClick={() => navigate('/integrations')}>{t('scanForm.github.connectButton')}</Button>
              </div>
            ) : (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"><Icon name={isRepo ? 'box' : 'globe'} size={18} /></span>
                <input value={target} onChange={(e) => setTarget(e.target.value)} required
                  placeholder={isRepo ? 'acme/payments-api' : 'https://example.com'}
                  className="w-full h-[52px] rounded-xl bg-field border border-line pl-11 pr-4 text-[15px] text-ink placeholder:text-ink-faint outline-none focus:border-brand focus:bg-white transition-colors" />
              </div>
            )}

            {/* ── 소유권 인증 ───────────────────────────── */}
            {isRepo ? (
              ghConnected && (
                repoOwned ? (
                  <VerifiedBox text={t('scanForm.repoOwnership.verified', { login: user?.githubLogin })} />
                ) : repoOwner ? (
                  <div className="mt-4 rounded-xl bg-warning-soft px-4 py-3 flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-[13px] text-[#9a5b00]">
                      <Icon name="alert-triangle" size={16} /> {t('scanForm.repoOwnership.notOwned', { login: user?.githubLogin })}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => navigate('/integrations')}>{t('scanForm.repoOwnership.installButton')}</Button>
                  </div>
                ) : null
              )
            ) : (
              <DomainVerify
                vstate={vstate} vinfo={vinfo} validUrl={validUrl} selfScan={isSelfScanDomain(target)}
                onStart={startVerify} onCheck={checkVerify} onCopy={copy}
              />
            )}

            {!isRepo && (
              <>
                <label className="block text-[13px] font-medium text-ink-sub mt-4 mb-2">{t('scanForm.labels.email')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"><Icon name="mail" size={18} /></span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
                    className="w-full h-[52px] rounded-xl bg-field border border-line pl-11 pr-4 text-[15px] text-ink placeholder:text-ink-faint outline-none focus:border-brand focus:bg-white transition-colors" />
                </div>
              </>
            )}

            <div className="mt-4 flex items-center gap-1.5 text-[13px] text-ink-muted">
              <Icon name="info" size={15} />
              {isRepo ? (
                <span>
                  {t('scanForm.usage.sastPrefix')}{' '}
                  <span className={`font-semibold tnum ${noSastLeft ? 'text-danger' : 'text-brand'}`}>
                    {wallet ? wallet.sourceLinesLeft.toLocaleString('ko-KR') : '—'}{t('scanForm.usage.sastUnit')}
                  </span>{' '}
                  {t('scanForm.usage.sastSuffix')}
                </span>
              ) : (
                <span>
                  {t('scanForm.usage.dastPrefix')}{' '}
                  <Badge tone={noDastLeft ? 'danger' : 'brand'} size="sm" className="mx-0.5">
                    {wallet ? t('scanForm.usage.dastCount', { count: wallet.dastAvailable }) : '—'}
                  </Badge>{' '}
                  {t('scanForm.usage.dastSuffix')}
                </span>
              )}
            </div>

            {(noDastLeft || noSastLeft) && (
              <div className="mt-3 rounded-xl bg-danger-soft px-4 py-3 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[13px] text-danger">
                  <Icon name="alert-triangle" size={16} />
                  {noDastLeft ? t('scanForm.warnings.dastExhausted') : t('scanForm.warnings.sastLow')}
                </span>
                <Button size="sm" variant="dark" onClick={() => navigate('/mypage')}>{t('scanForm.warnings.rechargeButton')}</Button>
              </div>
            )}

            {isRepo && (
              <div className="mt-3 rounded-xl bg-field border border-line px-4 py-3 flex items-start gap-2">
                <span className="text-ink-faint mt-0.5"><Icon name="lock" size={15} /></span>
                <p className="text-[12.5px] text-ink-sub leading-relaxed">
                  <span className="font-semibold text-ink">{t('scanForm.privateRepo.title')}</span> {t('scanForm.privateRepo.installHint')}
                  <button type="button" onClick={() => navigate('/integrations')} className="text-brand font-semibold hover:underline mx-1">{t('scanForm.privateRepo.installButton')}</button>
                  {t('scanForm.privateRepo.selectHint')} <b>“Only select repositories”</b>{t('scanForm.privateRepo.selectHint2')}
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-danger text-sm">
                <Icon name="alert-triangle" size={16} /> {error}
              </div>
            )}

            <Button type="submit" size="lg" block loading={loading} className="mt-5" disabled={!canScan}>
              {isRepo ? t('scanForm.submit.repoButton') : t('scanForm.submit.scanButton')}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}

function VerifiedBox({ text }: { text: string }) {
  const { t } = useTranslation('scan')
  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-success-soft px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span className="text-success"><Icon name="check-circle" size={18} /></span>
        <div>
          <p className="text-[13.5px] font-semibold text-ink">{t('scanForm.verifiedBox.title')}</p>
          <p className="text-[12px] text-ink-sub">{text}</p>
        </div>
      </div>
    </div>
  )
}

function DomainVerify({
  vstate, vinfo, validUrl, selfScan, onStart, onCheck, onCopy,
}: {
  vstate: VState
  vinfo: DomainVerifyInit | null
  validUrl: boolean
  selfScan: boolean
  onStart: () => void
  onCheck: () => void
  onCopy: (t: string) => void
}) {
  const { t } = useTranslation('scan')
  if (!validUrl) {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-field px-4 py-3 text-[13px] text-ink-muted">
        <Icon name="lock" size={15} /> {t('scanForm.domainVerify.enterUrlHint')}
      </div>
    )
  }
  if (vstate === 'verified') {
    return <VerifiedBox text={selfScan ? t('scanForm.domainVerify.selfScanVerified') : t('scanForm.domainVerify.wellKnownVerified')} />
  }

  if (vstate === 'unverified') {
    return (
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-warning-soft px-4 py-3">
        <span className="flex items-center gap-2 text-[13px] text-[#9a5b00]"><Icon name="alert-triangle" size={16} /> {t('scanForm.domainVerify.required')}</span>
        <Button size="sm" variant="dark" onClick={onStart}>{t('scanForm.domainVerify.startButton')}</Button>
      </div>
    )
  }

  // pending / checking — 단계별 안내
  const filePath = vinfo?.path ?? '/.well-known/scanops-verify.txt'
  const token = vinfo?.token ?? '…'
  const publicPath = `public${filePath}`
  const verifyUrl = `https://${vinfo?.domain ?? t('scanForm.domainVerify.domainFallback')}${filePath}`
  const aiPrompt = t('scanForm.domainVerify.aiPrompt', { token })
  return (
    <div className="mt-4 rounded-xl border border-line bg-surface p-5">
      <p className="text-[13.5px] font-bold text-ink mb-1 flex items-center gap-1.5"><Icon name="file-text" size={15} /> {t('scanForm.domainVerify.stepsTitle')}</p>
      <p className="text-[12px] text-ink-muted mb-4">{t('scanForm.domainVerify.stepsSubtitle')}</p>
      <div className="flex flex-col gap-4">
        <Step n={1} title={t('scanForm.domainVerify.step1.title')}>
          <p className="text-[12.5px] text-ink-muted mb-2 leading-relaxed">
            {t('scanForm.domainVerify.step1.textBeforeCode1')} <code className="px-1 py-0.5 rounded bg-field text-ink-sub font-mono text-[11.5px]">public</code>{' '}
            {t('scanForm.domainVerify.step1.textAfterCode1')}
            <br />{t('scanForm.domainVerify.step1.textBeforeCode2')} <code className="px-1 py-0.5 rounded bg-field text-ink-sub font-mono text-[11.5px]">public/</code>{' '}
            {t('scanForm.domainVerify.step1.textAfterCode2')}
          </p>
          <CodeCopy value={publicPath} onCopy={onCopy} />
        </Step>
        <Step n={2} title={t('scanForm.domainVerify.step2.title')}>
          <CodeCopy value={token} onCopy={onCopy} mono />
        </Step>
        <Step n={3} title={t('scanForm.domainVerify.step3.title')}>
          <a href={verifyUrl} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[12.5px] text-brand font-medium hover:underline break-all">
            {verifyUrl} <Icon name="external-link" size={13} />
          </a>
          <p className="text-[12px] text-ink-muted mt-1">{t('scanForm.domainVerify.step3.hint')}</p>
        </Step>
      </div>

      {/* 바이브코더용 — AI에게 그대로 시키기 */}
      <div className="mt-4 rounded-lg bg-field border border-line p-3">
        <p className="text-[12px] font-semibold text-ink-sub mb-1.5 flex items-center gap-1.5">
          <Icon name="zap" size={13} /> {t('scanForm.domainVerify.aiHelperTitle')}
        </p>
        <CodeCopy value={aiPrompt} onCopy={onCopy} />
      </div>

      <div className="mt-4 pt-3.5 border-t border-line flex items-center gap-2.5">
        <Button size="sm" onClick={onCheck} loading={vstate === 'checking'} leftIcon="refresh-cw">{t('scanForm.domainVerify.checkButton')}</Button>
        <span className="text-[12px] text-ink-muted">{t('scanForm.domainVerify.checkHint')}</span>
      </div>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-6 h-6 rounded-full bg-brand text-white text-[12px] font-bold flex items-center justify-center shrink-0">{n}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-ink mb-1.5">{title}</p>
        {children}
      </div>
    </div>
  )
}

function CodeCopy({ value, onCopy, mono }: { value: string; onCopy: (t: string) => void; mono?: boolean }) {
  const { t } = useTranslation('scan')
  return (
    <div className="flex items-center gap-2">
      <code className={`flex-1 min-w-0 truncate rounded-lg bg-white border border-line px-3 py-2 text-[12.5px] text-ink-sub ${mono ? 'font-mono' : 'font-mono'}`}>{value}</code>
      <button type="button" onClick={() => onCopy(value)} className="w-9 h-9 rounded-lg border border-line bg-white flex items-center justify-center text-ink-muted hover:text-ink shrink-0" aria-label={t('scanForm.copy.ariaLabel')}>
        <Icon name="copy" size={15} />
      </button>
    </div>
  )
}

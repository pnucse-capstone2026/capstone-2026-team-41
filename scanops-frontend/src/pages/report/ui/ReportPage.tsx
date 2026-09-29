import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import AppNav from '../../../shared/ui/AppNav'
import Card from '../../../shared/ui/Card'
import Button from '../../../shared/ui/Button'
import Icon from '../../../shared/ui/Icon'
import Badge, { SeverityBadge } from '../../../shared/ui/Badge'
import { useToast } from '../../../shared/ui/Toast'
import {
  fetchReport, MODE_META, SEVERITY_META, formatDateTime,
  type Report, type Vulnerability, type Severity, type SeverityCounts,
} from '../../../shared/lib/mock'
import { useModeLabel } from '../../../shared/lib/planText'
import { isRealId, fetchRealReport } from '../../../shared/api/scan'

const SEV_ORDER: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']

// The API does not yet return a per-scan engine identifier. Keep this label accurate for
// both routes: Java uses CPG + Qwen3.8-Max, while other languages retain the legacy engine.
const SAST_ENGINE_LABEL = 'ScanOps SAST (언어별 분석 엔진)'

export default function ReportPage() {
  const { t } = useTranslation('report')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [report, setReport] = useState<Report | null>(null)
  const modeLabel = useModeLabel(report?.mode ?? 'WEBSITE')

  useEffect(() => {
    if (!id) return
    const load = isRealId(id) ? fetchRealReport(id) : fetchReport(id)
    load.then(setReport).catch(() => fetchReport('s-1041').then(setReport))
  }, [id])

  if (!report) {
    return (
      <div className="min-h-screen bg-surface">
        <AppNav />
        <main className="max-w-[860px] mx-auto px-6 py-8 flex flex-col gap-4">
          <div className="h-7 w-40 rounded skeleton" />
          <div className="h-32 rounded-2xl skeleton" />
          <div className="h-24 rounded-2xl skeleton" />
        </main>
      </div>
    )
  }

  const m = MODE_META[report.mode]
  const sorted = [...report.vulnerabilities].sort((a, b) => b.cvss - a.cvss)

  return (
    <div className="min-h-screen bg-surface">
      <AppNav />
      <main className="max-w-[860px] mx-auto px-6 py-7 fade-up">
        <button onClick={() => navigate('/reports')} className="flex items-center gap-1 text-[13px] text-ink-muted font-medium hover:text-ink-sub mb-4">
          <Icon name="chevron-left" size={16} /> {t('back')}
        </button>

        {/* header */}
        <Card pad="lg">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge tone={report.mode === 'WEBSITE' ? 'brand' : report.mode === 'GITHUB_REPO' ? 'purple' : 'success'}>{m.tag} · {modeLabel}</Badge>
                <span className="text-[12.5px] text-ink-muted">{formatDateTime(report.createdAt)}</span>
              </div>
              <h1 className="text-[22px] font-bold text-ink tracking-tight break-all flex items-center gap-2">
                <span style={{ color: m.color }}><Icon name={m.icon} size={20} /></span>{report.target}
              </h1>
              <p className="mt-1 text-[13px] text-ink-muted">
                {t('detail.analysisLabel')} {report.durationSec ? t('detail.seconds', { value: report.durationSec }) : ''}{report.loc ? ` · ${t('detail.lines', { value: report.loc.toLocaleString('ko-KR') })}` : ''} · {t('detail.engineLabel')} {report.mode === 'WEBSITE' ? t('detail.engineWebsite') : SAST_ENGINE_LABEL}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" leftIcon="download" onClick={() => toast(t('detail.toast.pdfReady'))}>PDF</Button>
              <Button size="sm" leftIcon="refresh-cw" onClick={() => navigate('/scan')}>{t('detail.rescan')}</Button>
            </div>
          </div>

          <div className="h-px bg-line my-5" />

          <div className="flex items-center gap-6 flex-wrap">
            <Stat value={String(report.total)} label={t('detail.stats.vulnerabilities')} />
            <div className="w-px h-10 bg-line" />
            <Stat value={report.maxCvss.toFixed(1)} label={t('detail.stats.maxCvss')} color={report.maxCvss >= 9 ? 'var(--color-sev-critical)' : 'var(--color-sev-high)'} />
            <div className="w-px h-10 bg-line" />
            <div className="flex-1 min-w-[200px]">
              <SeverityBar counts={report.counts} total={report.total} />
              <div className="flex flex-wrap gap-x-3.5 gap-y-1 mt-2.5">
                {SEV_ORDER.filter((k) => report.counts[k] > 0).map((k) => (
                  <span key={k} className="flex items-center gap-1.5 text-[12px] text-ink-sub">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: SEVERITY_META[k].color }} />
                    {SEVERITY_META[k].label} <b className="text-ink tnum">{report.counts[k]}</b>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {report.total === 0 ? (
          <Card pad="lg" className="mt-4 text-center py-14">
            <span className="inline-flex w-14 h-14 rounded-2xl bg-success-soft text-success items-center justify-center mb-3"><Icon name="check-circle" size={28} /></span>
            <p className="text-[15px] font-semibold text-ink">{t('detail.empty.title')}</p>
            <p className="mt-1 text-[13px] text-ink-muted">{t('detail.empty.desc')}</p>
          </Card>
        ) : (
          <div className="mt-4 flex flex-col gap-2.5">
            <p className="text-[13px] font-semibold text-ink-sub px-1">{t('detail.foundCount', { count: report.total })}</p>
            {sorted.map((v, i) => <VulnCard key={v.id} v={v} defaultOpen={i === 0} onCopy={() => toast(t('detail.toast.copied'), 'success')} />)}
          </div>
        )}
      </main>
    </div>
  )
}

function Stat({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div className="text-center">
      <p className="text-[28px] font-bold tnum leading-none" style={{ color: color ?? 'var(--color-ink)' }}>{value}</p>
      <p className="mt-1 text-[12px] text-ink-muted">{label}</p>
    </div>
  )
}

function SeverityBar({ counts, total }: { counts: SeverityCounts; total: number }) {
  if (total === 0) return <div className="h-2.5 rounded-full bg-field" />
  return (
    <div className="flex h-2.5 rounded-full overflow-hidden bg-field">
      {SEV_ORDER.map((k) => counts[k] > 0 && <div key={k} style={{ width: `${(counts[k] / total) * 100}%`, background: SEVERITY_META[k].color }} />)}
    </div>
  )
}

const VERDICT: Record<Vulnerability['graphVerdict'], { key: string; tone: 'success' | 'brand' | 'neutral' }> = {
  CONFIRMED: { key: 'confirmed', tone: 'success' },
  SUPPRESSED: { key: 'suppressed', tone: 'neutral' },
  LLM_ONLY: { key: 'llmOnly', tone: 'brand' },
}

function VulnCard({ v, defaultOpen, onCopy }: { v: Vulnerability; defaultOpen?: boolean; onCopy: () => void }) {
  const { t } = useTranslation('report')
  const [open, setOpen] = useState(defaultOpen)
  const sev = SEVERITY_META[v.severity]
  const verdict = VERDICT[v.graphVerdict]

  return (
    <Card pad="none" className="overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3.5 px-5 py-4 text-left hover:bg-surface transition-colors">
        <span className="w-1.5 self-stretch rounded-full shrink-0" style={{ background: sev.color }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[15px] font-bold text-ink">{v.name}</p>
            <span className="text-[12px] text-ink-muted font-medium">{v.cwe}</span>
          </div>
          <p className="text-[12.5px] text-ink-muted truncate mt-0.5">{v.location}</p>
        </div>
        <SeverityBadge severity={v.severity} size="sm" />
        <span className="text-[13px] font-bold tnum" style={{ color: sev.color }}>{v.cvss.toFixed(1)}</span>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} className="text-ink-faint" />
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-line">
          {/* 비전문가용 한 줄 설명 */}
          {v.plain && (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-brand-soft/60 px-4 py-3">
              <span className="text-brand mt-0.5 shrink-0"><Icon name="info" size={16} /></span>
              <p className="text-[13.5px] text-ink-sub leading-relaxed">
                <span className="font-bold text-brand">{t('vuln.plainLabel')}</span>　{v.plain}
              </p>
            </div>
          )}
          {v.summary && <p className="text-[13.5px] text-ink-sub leading-relaxed mt-3">{v.summary}</p>}

          {v.evidence && (
            <Section icon="code" title={t('vuln.evidence')}>
              <CodeBlock code={v.evidence} onCopy={onCopy} />
              <p className="mt-2 text-[12px] text-ink-muted">{t('vuln.locationLabel')} <span className="font-medium text-ink-sub">{v.location}</span></p>
            </Section>
          )}

          {v.attack && (
            <Section icon="alert-triangle" title={t('vuln.attackScenario')} tone="danger">
              <p className="text-[13.5px] text-ink-sub leading-relaxed">{v.attack}</p>
            </Section>
          )}

          {v.fix && (
            <Section icon="check-circle" title={t('vuln.fixMethod')} tone="success">
              <p className="text-[13.5px] text-ink-sub leading-relaxed">{v.fix}</p>
              {v.fixCode && <div className="mt-2.5"><CodeBlock code={v.fixCode} onCopy={onCopy} good /></div>}
              <button
                type="button"
                onClick={() => { navigator.clipboard?.writeText(buildFixPrompt(v, t)); onCopy() }}
                className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-success-soft text-success text-[12.5px] font-semibold hover:bg-success-soft transition-colors"
              >
                <Icon name="zap" size={13} /> {t('vuln.copyFixPrompt')}
              </button>
            </Section>
          )}

          <div className="mt-4 pt-3 border-t border-line">
            <p className="text-[11.5px] font-bold text-ink-muted mb-2">{t('vuln.detectionBasis')}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone={verdict.tone} size="sm"><Icon name="shield" size={12} /> {t(`vuln.verdict.${verdict.key}`)}</Badge>
              <Badge tone="neutral" size="sm"><Icon name="cpu" size={12} /> {v.aiModel}</Badge>
              <Badge tone="neutral" size="sm">{t('vuln.confidence', { value: (v.confidence * 100).toFixed(0) })}</Badge>
              <span className="ml-auto text-[11px] text-ink-faint font-mono hidden sm:block">{v.cvssVector}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

/** 사용자가 ChatGPT·Claude 등에 그대로 붙여넣어 수정 코드를 받을 수 있는 프롬프트 생성 (LLM 호출 없음). */
function buildFixPrompt(v: Vulnerability, t: TFunction): string {
  return [
    t('vuln.fixPrompt.intro'),
    '',
    `${t('vuln.fixPrompt.vulnLabel')} ${v.name}${v.cwe ? ` (${v.cwe})` : ''}`,
    `${t('vuln.fixPrompt.severityLabel')} ${v.severity} · CVSS ${v.cvss.toFixed(1)}`,
    v.location ? `${t('vuln.fixPrompt.locationLabel')} ${v.location}` : '',
    v.summary ? `${t('vuln.fixPrompt.problemLabel')} ${v.summary}` : '',
    v.fix ? `${t('vuln.fixPrompt.fixLabel')} ${v.fix}` : '',
    '',
    t('vuln.fixPrompt.outro'),
  ].filter(Boolean).join('\n')
}

function Section({ icon, title, tone, children }: { icon: Parameters<typeof Icon>[0]['name']; title: string; tone?: 'danger' | 'success'; children: React.ReactNode }) {
  const color = tone === 'danger' ? 'var(--color-danger)' : tone === 'success' ? 'var(--color-success)' : 'var(--color-ink-sub)'
  const box = tone === 'danger' ? 'bg-danger-soft/40' : tone === 'success' ? 'bg-success-soft/50' : ''
  return (
    <div className="mt-4">
      <p className="flex items-center gap-1.5 text-[12.5px] font-bold mb-2" style={{ color }}>
        <Icon name={icon} size={14} /> {title}
      </p>
      {tone ? <div className={`rounded-xl px-4 py-3 ${box}`}>{children}</div> : children}
    </div>
  )
}

function CodeBlock({ code, onCopy, good }: { code: string; onCopy: () => void; good?: boolean }) {
  const { t } = useTranslation('report')
  return (
    <div className="relative group">
      <pre className={`rounded-xl px-4 py-3 text-[12.5px] leading-relaxed font-mono overflow-x-auto border ${
        good ? 'bg-success-soft/50 border-success-soft text-[#0a7a4d]' : 'bg-[#f6f8fa] border-line text-ink-sub'
      }`}>
        <code>{code}</code>
      </pre>
      <button
        onClick={() => { navigator.clipboard?.writeText(code); onCopy() }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg bg-white border border-line flex items-center justify-center text-ink-muted hover:text-ink"
        aria-label={t('vuln.copyAriaLabel')}
      >
        <Icon name="copy" size={14} />
      </button>
    </div>
  )
}

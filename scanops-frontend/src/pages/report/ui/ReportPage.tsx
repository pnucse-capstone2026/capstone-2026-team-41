import CpgGraphView from './CpgGraphView'
import SourceContextView from './SourceContextView'
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
import { weaknessReference } from '../../../shared/lib/cweMeta'
import { useModeLabel } from '../../../shared/lib/planText'
import { isRealId, fetchRealReport } from '../../../shared/api/scan'

const SEV_ORDER: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']

export default function ReportPage({ previewReport }: { previewReport?: Report } = {}) {
  const { t, i18n } = useTranslation('report')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const requestKey = `${id}:${i18n.language}`
  const [result, setResult] = useState<{ key: string; report: Report | null; error: boolean } | null>(null)
  const report = previewReport ?? (result?.key === requestKey ? result.report : null)
  const loadError = !previewReport && result?.key === requestKey && result.error
  const modeLabel = useModeLabel(report?.mode ?? 'WEBSITE')

  useEffect(() => {
    if (previewReport) return
    if (!id) return
    let active = true
    const load = isRealId(id) ? fetchRealReport(id) : fetchReport(id)
    load.then((report) => { if (active) setResult({ key: requestKey, report, error: false }) }).catch(() => { if (active) setResult({ key: requestKey, report: null, error: true }) })
    return () => { active = false }
  }, [id, requestKey, previewReport])

  if (loadError) return (
    <div className="min-h-screen bg-surface"><AppNav /><main className="max-w-[980px] mx-auto px-6 py-12"><Card pad="lg"><h1 className="text-xl font-bold">{t('detail.loadError')}</h1><Button className="mt-4" onClick={() => navigate('/reports')}>{t('back')}</Button></Card></main></div>
  )

  if (!report) {
    return (
      <div className="min-h-screen bg-surface">
        <AppNav />
        <main className="max-w-[980px] mx-auto px-6 py-8 flex flex-col gap-4">
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
      <main className="max-w-[980px] mx-auto px-4 sm:px-6 py-8 sm:py-10 fade-up">
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
                {t('detail.analysisLabel')} {report.durationSec ? t('detail.seconds', { value: report.durationSec }) : ''}{report.loc ? ` · ${t('detail.lines', { value: report.loc.toLocaleString('ko-KR') })}` : ''}
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
            <Stat value={report.maxCvss > 0 ? report.maxCvss.toFixed(1) : '—'} label={t('detail.stats.maxCvss')} color={report.maxCvss <= 0 ? 'var(--color-ink-muted)' : report.maxCvss >= 9 ? 'var(--color-sev-critical)' : 'var(--color-sev-high)'} />
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

function VulnCard({ v, defaultOpen, onCopy }: { v: Vulnerability; defaultOpen?: boolean; onCopy: () => void }) {
  const { t } = useTranslation('report')
  const { toast } = useToast()
  const [open, setOpen] = useState(defaultOpen)
  const sev = SEVERITY_META[v.severity]
  const reference = weaknessReference(`${v.name} ${v.cwe}`)

  return (
    <Card pad="none" className="overflow-hidden !rounded-2xl border-line-strong shadow-[0_4px_20px_-12px_rgba(25,31,40,0.18)]">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={Boolean(open)} aria-controls={`finding-${v.id}`} className="w-full flex items-start sm:items-center gap-3 px-5 sm:px-7 py-6 text-left hover:bg-surface transition-colors focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-[-2px]">
        <span className="w-1.5 self-stretch rounded-full shrink-0" style={{ background: sev.color }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[18px] font-bold text-ink">{v.name}</p>
            <span className="text-[12px] text-ink-muted font-medium">{v.cwe}</span>
          </div>

        </div>
        <SeverityBadge severity={v.severity} size="sm" />

        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} className="text-ink-faint" />
      </button>

      {open && (
        <div id={`finding-${v.id}`} className="px-5 sm:px-7 pb-7 pt-1 border-t border-line">
          <Section icon="info" title={t('vuln.typeDescription')}>
            <p className="rounded-xl bg-brand-soft/50 px-5 py-4 text-[15px] text-ink leading-7 break-keep">{v.plain}</p>
          </Section>
          <Section icon="code" title={t('vuln.source.title')}>
            <SourceContextView v={v} />
            {(v.cpgGraph || v.sourceContext || v.location.startsWith('https://github.com/')) && (
              <div className="mt-4"><CpgGraphView key={v.id} graph={v.cpgGraph} /></div>
            )}
          </Section>

          {v.attack && (
            <Section icon="alert-triangle" title={t('vuln.attackScenario')} tone="danger">
              <p className="text-[15px] text-ink-sub leading-7 whitespace-pre-line">{v.attack}</p>
            </Section>
          )}

          {v.fix && (
            <Section icon="check-circle" title={t('vuln.fixMethod')} tone="success">
              <p className="text-[15px] text-ink-sub leading-7 whitespace-pre-line">{v.fix}</p>
              {v.fixCode && <div className="mt-2.5"><CodeBlock code={v.fixCode} onCopy={onCopy} good /></div>}
              <button
                type="button"
                onClick={async () => { try { await navigator.clipboard.writeText(buildFixPrompt(v, t)); onCopy() } catch { toast(t('detail.toast.copyFailed'), 'danger') } }}
                className="mt-3 inline-flex items-center gap-1.5 min-h-10 px-4 rounded-lg bg-brand text-white text-[13px] font-semibold hover:bg-brand-hover transition-colors"
              >
                <Icon name="zap" size={13} /> {t('vuln.copyFixPrompt')}
              </button>
            </Section>
          )}

          {reference && <a href={reference} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:underline">{t('vuln.reference')} <Icon name="arrow-right" size={14} /></a>}

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
    `${t('vuln.fixPrompt.severityLabel')} ${v.severity}${v.cvss > 0 ? ` · CVSS ${v.cvss.toFixed(1)}` : ''}`,
    v.location ? `${t('vuln.fixPrompt.locationLabel')} ${v.location}` : '',
    v.summary ? `${t('vuln.fixPrompt.problemLabel')} ${v.summary}` : '',
    v.fix ? `${t('vuln.fixPrompt.fixLabel')} ${v.fix}` : '',
    '',
    t('vuln.fixPrompt.outro'),
  ].filter(Boolean).join('\n')
}

function Section({ icon, title, tone, children }: { icon: Parameters<typeof Icon>[0]['name']; title: string; tone?: 'danger' | 'success'; children: React.ReactNode }) {
  const color = tone === 'success' ? 'var(--color-brand-press)' : 'var(--color-ink)'
  const box = tone === 'success' ? 'bg-brand-soft/60 border border-brand/15' : 'bg-surface border border-line'
  return (
    <div className="mt-6">
      <p className="flex items-center gap-1.5 text-[15px] font-bold mb-3" style={{ color }}>
        <Icon name={icon} size={14} /> {title}
      </p>
      {tone ? <div className={`rounded-xl px-4 sm:px-5 py-4 ${box}`}>{children}</div> : children}
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

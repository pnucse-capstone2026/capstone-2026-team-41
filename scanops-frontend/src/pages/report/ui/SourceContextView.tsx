import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Vulnerability } from '../../../shared/lib/mock'
import {
  fetchSourceContext,
  githubSourceLocation,
  type SourceContext,
} from '../../../shared/lib/sourceContext'

export default function SourceContextView({ v }: { v: Vulnerability }) {
  const { t } = useTranslation('report')
  const [result, setResult] = useState<{ location: string; context: SourceContext | null } | null>(
    null
  )
  const parsed = githubSourceLocation(v.location)
  const supported = Boolean(parsed)
  const saved = v.sourceContext
  useEffect(() => {
    if (saved || !supported) return
    const controller = new AbortController()
    let active = true
    const timer = setTimeout(() => controller.abort(), 10000)
    fetchSourceContext(v.location, controller.signal)
      .then((context) => {
        if (active) setResult({ location: v.location, context })
      })
      .catch(() => {
        if (active) setResult({ location: v.location, context: null })
      })
      .finally(() => clearTimeout(timer))
    return () => {
      active = false
      clearTimeout(timer)
      controller.abort()
    }
  }, [v.location, saved, supported])
  const context = saved ?? (result?.location === v.location ? result.context : null)
  const loading = !saved && supported && result?.location !== v.location
  const fileLabel = context?.path ?? parsed?.path ?? v.location

  return (
    <div className="overflow-hidden rounded-xl border border-line-strong">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-field px-4 py-3 border-b border-line">
        <span className="text-[12.5px] font-mono text-ink break-all">
          {fileLabel || t('vuln.locationUnknown')}
        </span>
        {context && (
          <span className="text-[12px] font-semibold text-brand-press">
            {t('vuln.source.target', { line: context.targetLine })}
          </span>
        )}
      </div>
      {context ? (
        <>
          <div
            className="overflow-x-auto bg-white"
            tabIndex={0}
            role="region"
            aria-label={t('vuln.source.title')}
          >
            <pre className="m-0 min-w-max py-3 text-[13px] leading-7 font-mono">
              <code>
                {context.code.split('\n').map((line, index) => {
                  const number = context.startLine + index
                  const selected = number === context.targetLine
                  return (
                    <span
                      key={number}
                      className={`flex pr-5 border-l-[3px] ${selected ? 'bg-brand-soft border-brand text-ink font-semibold' : 'border-transparent text-ink-sub'}`}
                      aria-current={selected ? 'location' : undefined}
                    >
                      <span
                        aria-hidden="true"
                        className={`select-none shrink-0 w-14 pr-4 text-right ${selected ? 'text-brand-press' : 'text-ink-muted'}`}
                      >
                        {number}
                      </span>
                      <span>{line || ' '}</span>
                    </span>
                  )
                })}
              </code>
            </pre>
          </div>
          <p className="px-4 py-2.5 text-xs text-ink-sub border-t border-line bg-surface">
            {t(context.origin === 'scan' ? 'vuln.source.snapshot' : 'vuln.source.current')}
          </p>
        </>
      ) : (
        <p role="status" className="p-4 text-[14px] leading-relaxed text-ink-sub bg-surface">
          {t(loading ? 'vuln.source.loading' : supported ? 'vuln.source.unavailable' : 'vuln.source.notProvided')}
        </p>
      )}
      {parsed && (
        <a
          href={parsed.reference}
          target="_blank"
          rel="noreferrer"
          className="block px-4 py-2.5 text-xs font-semibold text-brand-press border-t border-line hover:bg-brand-soft"
        >
          {t('vuln.source.open')}
        </a>
      )}
    </div>
  )
}

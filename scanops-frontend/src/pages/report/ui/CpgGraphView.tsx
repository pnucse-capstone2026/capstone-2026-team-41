import { lazy, Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CpgGraph } from '../../../shared/lib/cpgGraph'

const GraphCanvas = lazy(() => import('./CpgGraphCanvas'))

export default function CpgGraphView({ graph }: { graph?: CpgGraph }) {
  const { t } = useTranslation('report')
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string>()
  const selected = graph?.nodes.find((n) => n.id === selectedId) ?? graph?.nodes[0]
  return (
    <details
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="rounded-2xl border border-brand/20 overflow-hidden group"
    >
      <summary className="cursor-pointer px-5 py-4 bg-brand-soft text-[15px] font-semibold text-brand-press focus-visible:outline-brand">
        {t('vuln.cpg.title')}
        <span className="ml-3 text-[12px] font-normal text-ink-sub">
          {graph ? t('vuln.cpg.open') : t('vuln.cpg.noData')}
        </span>
      </summary>
      {!graph || !selected ? (
        <p className="px-5 py-5 text-[14px] text-ink-sub leading-6">{t('vuln.cpg.unavailable')}</p>
      ) : (
        <div className="p-5 space-y-5">
          <p className="text-[14px] text-ink-sub leading-6">
            {t(graph.evidence === 'code-context' ? 'vuln.cpg.context' : `vuln.cpg.${graph.kind}`)}
          </p>
          {graph.evidence === 'code-context' && graph.requestedLine !== graph.anchorLine && (
            <p className="text-[13px] text-ink-sub">
              {t('vuln.cpg.anchor', { requested: graph.requestedLine, anchor: graph.anchorLine })}
            </p>
          )}
          {graph.truncated && <p className="text-[13px] text-ink-sub">{t('vuln.cpg.limited')}</p>}
          {open && (
            <Suspense fallback={<p className="h-96 p-5 text-ink-sub">{t('vuln.cpg.loading')}</p>}>
              <GraphCanvas graph={graph} selectedId={selected.id} onSelect={setSelectedId} />
            </Suspense>
          )}
          <div className="rounded-xl border border-line overflow-hidden" aria-live="polite">
            <div className="bg-surface px-4 py-3 text-[13px] flex flex-wrap justify-between gap-2">
              <span className="break-all font-medium">
                {selected.file}:{selected.line}
              </span>
              <span className="text-ink-sub">
                {t(selected.excerpt ? 'vuln.cpg.snapshot' : 'vuln.cpg.recorded')}
              </span>
            </div>
            <div className="overflow-x-auto py-3 bg-surface text-[13px] font-mono leading-7">
              {selected.excerpt ? (
                selected.excerpt.code.split('\n').map((line, index) => {
                  const number = (selected.excerpt?.startLine ?? selected.line) + index
                  return (
                    <div
                      key={index}
                      className={`flex min-w-max pr-4 ${number === selected.line ? 'bg-brand/10 border-l-2 border-brand' : 'border-l-2 border-transparent'}`}
                    >
                      <span className="w-14 shrink-0 text-right pr-4 text-ink-sub select-none">
                        {number}
                      </span>
                      <code className="whitespace-pre">{line || ' '}</code>
                    </div>
                  )
                })
              ) : (
                <pre className="px-4 whitespace-pre">{selected.code}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </details>
  )
}

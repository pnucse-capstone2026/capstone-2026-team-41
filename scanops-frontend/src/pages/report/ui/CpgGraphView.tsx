import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CpgGraph } from '../../../shared/lib/cpgGraph'

export default function CpgGraphView({ graph }: { graph?: CpgGraph }) {
  const { t } = useTranslation('report')
  const [selectedId, setSelectedId] = useState<string>()
  const selected = graph?.nodes.find((n) => n.id === selectedId) ?? graph?.nodes[0]
  return (
    <details className="rounded-2xl border border-brand/20 overflow-hidden group">
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
          <p className="text-[14px] text-ink-sub leading-6">{t(`vuln.cpg.${graph.kind}`)}</p>
          <div className="overflow-x-auto pb-3" role="group" aria-label={t('vuln.cpg.title')}>
            <div className="flex items-center w-max min-w-full py-2">
              {graph.nodes.map((node, i) => (
                <div key={node.id} className="flex items-center">
                  {i > 0 && (
                    <svg
                      width="44"
                      height="28"
                      viewBox="0 0 44 28"
                      className="text-brand shrink-0"
                      aria-hidden="true"
                    >
                      <path
                        d="M0 14H39M33 8L39 14L33 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                  <button
                    type="button"
                    aria-pressed={node.id === selected.id}
                    onClick={() => setSelectedId(node.id)}
                    className={`w-56 text-left rounded-xl border p-4 transition-colors focus-visible:outline-brand ${node.id === selected.id ? 'border-brand bg-brand-soft ring-2 ring-brand/15' : 'border-line bg-white hover:border-brand/50'}`}
                  >
                    <div className="flex justify-between text-[12px] font-semibold mb-3">
                      <span className="text-brand">{t(`vuln.cpg.${node.role}`)}</span>
                      <span className="text-ink-sub">{i + 1}</span>
                    </div>
                    <code className="block text-[13px] leading-6 line-clamp-2 break-all h-12">
                      {node.code}
                    </code>
                    <span
                      className="block mt-3 text-[12px] text-ink-sub truncate"
                      title={node.file}
                    >
                      {node.file.split('/').at(-1)}:{node.line}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
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

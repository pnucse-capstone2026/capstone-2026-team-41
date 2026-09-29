import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { useTour } from '../lib/tour'
import Icon from './Icon'

interface Rect { top: number; left: number; width: number; height: number }

const PAD = 8

/** Full-screen guided tour: blurred/dimmed backdrop with a live "cutout" around the target element. */
export default function TourOverlay() {
  const { t } = useTranslation('common')
  const { active, stepIndex, steps, next, prev, skip } = useTour()
  const step = steps[stepIndex]
  const [rect, setRect] = useState<Rect | null>(null)
  const lostRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useLayoutEffect(() => {
    if (!active) { setRect(null); return }
    setRect(null)

    const measure = () => {
      const el = document.querySelector(step.selector)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { top: r.top, left: r.left, width: r.width, height: r.height }
    }

    const el = document.querySelector(step.selector)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    let raf = 0
    const recompute = () => { const r = measure(); if (r) setRect(r) }
    const loop = () => { recompute(); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)

    // If the target never appears (e.g. hidden on a small viewport), skip this step instead of stalling.
    if (lostRef.current) clearTimeout(lostRef.current)
    lostRef.current = setTimeout(() => { if (!measure()) next() }, 1500)

    return () => {
      cancelAnimationFrame(raf)
      if (lostRef.current) clearTimeout(lostRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIndex, step?.selector])

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, skip, next, prev])

  if (!active || !rect) return null

  const vw = window.innerWidth
  const vh = window.innerHeight
  const hole = {
    top: Math.max(0, rect.top - PAD),
    left: Math.max(0, rect.left - PAD),
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  }

  const cardWidth = Math.min(340, vw - 32)
  const spaceBelow = vh - (hole.top + hole.height)
  const placeBelow = step.placement === 'bottom' && spaceBelow > 190 ? true : step.placement === 'top' ? false : spaceBelow > 190
  const cardTop = placeBelow ? Math.min(hole.top + hole.height + 14, vh - 220) : Math.max(12, hole.top - 14)
  const cardLeft = Math.min(Math.max(12, hole.left), vw - cardWidth - 12)

  const dimStyle: CSSProperties = {
    position: 'fixed',
    background: 'rgba(15, 20, 28, 0.55)',
    backdropFilter: 'blur(3px)',
    WebkitBackdropFilter: 'blur(3px)',
    zIndex: 100,
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  }

  return (
    <div className="fixed inset-0" style={{ zIndex: 100 }} role="dialog" aria-modal="true">
      {/* four strips frame the spotlight hole, so the target itself stays fully visible/interactive */}
      <div style={{ ...dimStyle, top: 0, left: 0, right: 0, height: hole.top }} />
      <div style={{ ...dimStyle, top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} />
      <div style={{ ...dimStyle, top: hole.top, left: 0, width: hole.left, height: hole.height }} />
      <div style={{ ...dimStyle, top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} />

      {/* highlight ring */}
      <div
        className="fixed rounded-xl pointer-events-none"
        style={{
          top: hole.top, left: hole.left, width: hole.width, height: hole.height,
          boxShadow: '0 0 0 3px var(--color-brand), 0 0 24px rgba(49,130,246,0.45)',
          zIndex: 101,
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* tooltip card */}
      <div
        className="fixed bg-white rounded-2xl border border-line shadow-[0px_16px_40px_rgba(15,20,28,0.25)] p-5"
        style={{ top: cardTop, left: cardLeft, width: cardWidth, zIndex: 102, transition: 'top 0.25s cubic-bezier(0.16, 1, 0.3, 1), left 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11.5px] font-bold text-brand">{stepIndex + 1} / {steps.length}</span>
          <button onClick={skip} className="text-ink-faint hover:text-ink-sub -m-1 p-1" aria-label={t('tourOverlay.closeGuide')}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <h3 className="text-[15.5px] font-bold text-ink">{t(step.titleKey)}</h3>
        <p className="mt-1.5 text-[13.5px] text-ink-sub leading-relaxed">{t(step.descKey)}</p>

        <div className="mt-4 flex items-center gap-2">
          {stepIndex > 0 ? (
            <button onClick={prev} className="flex-1 h-9 rounded-lg border border-line text-[13px] font-semibold text-ink-sub hover:bg-surface transition-colors">
              {t('tourOverlay.previous')}
            </button>
          ) : (
            <button onClick={skip} className="flex-1 h-9 rounded-lg text-[13px] font-medium text-ink-muted hover:text-ink-sub transition-colors">
              {t('tourOverlay.skip')}
            </button>
          )}
          <button onClick={next} className="flex-1 h-9 rounded-lg bg-brand text-white text-[13px] font-semibold hover:bg-brand-hover transition-colors">
            {stepIndex + 1 >= steps.length ? t('tourOverlay.start') : t('tourOverlay.next')}
          </button>
        </div>
      </div>
    </div>
  )
}

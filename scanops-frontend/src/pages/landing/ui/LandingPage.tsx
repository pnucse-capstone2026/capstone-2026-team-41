import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Logo from '../../../shared/ui/Logo'
import Icon, { type IconName } from '../../../shared/ui/Icon'
import Button from '../../../shared/ui/Button'
import LanguageSwitcher from '../../../shared/ui/LanguageSwitcher'
import { ENABLE_PRICING } from '../../../shared/lib/config'

// ── page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { t } = useTranslation('landing')
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  // ── data (translated) ───────────────────────────────────────────────────────

  const NAV_LINKS = [
    { label: t('nav.verify'), href: '#benchmark' },
    { label: t('nav.whyDifferent'), href: '#why' },
    { label: t('nav.codeSecurity'), href: '#security' },
    ...(ENABLE_PRICING ? [{ label: t('nav.pricing'), href: '#pricing' }] : []),
  ]

  const stats = [
    { value: t('stats.noExternalCode.value'), label: t('stats.noExternalCode.label') },
    { value: t('stats.hybrid.value'), label: t('stats.hybrid.label') },
    { value: t('stats.threeModes.value'), label: t('stats.threeModes.label') },
  ]

  const whyCards: { icon: IconName; title: string; desc: string }[] = [
    { icon: 'cpu', title: t('why.cards.localModel.title'), desc: t('why.cards.localModel.desc') },
    { icon: 'layers', title: t('why.cards.wholeRepo.title'), desc: t('why.cards.wholeRepo.desc') },
    { icon: 'shield', title: t('why.cards.confidentFilter.title'), desc: t('why.cards.confidentFilter.desc') },
  ]

  const scanModes: { tag: string; icon: IconName; accent: string; soft: string; title: string; desc: string }[] = [
    { tag: 'DAST', icon: 'globe', accent: 'var(--color-scan-web)', soft: 'var(--color-brand-soft)', title: t('scanModes.dast.title'), desc: t('scanModes.dast.desc') },
    { tag: 'SAST', icon: 'box', accent: 'var(--color-scan-code)', soft: 'var(--color-purple-soft)', title: t('scanModes.sast.title'), desc: t('scanModes.sast.desc') },
    { tag: 'Actions', icon: 'git-pull-request', accent: 'var(--color-scan-pr)', soft: 'var(--color-success-soft)', title: t('scanModes.actions.title'), desc: t('scanModes.actions.desc') },
  ]

  const plans = [
    { name: 'Free', price: '₩0', per: '', desc: t('pricing.free.desc'), feats: t('pricing.free.feats', { returnObjects: true }) as string[], primary: false },
    { name: 'Pro', price: '₩19,900', per: t('pricing.perMonth'), desc: t('pricing.pro.desc'), feats: t('pricing.pro.feats', { returnObjects: true }) as string[], primary: true },
    { name: 'Max', price: '₩69,000', per: t('pricing.perMonth'), desc: t('pricing.max.desc'), feats: t('pricing.max.feats', { returnObjects: true }) as string[], primary: false },
  ]

  return (
    <div className="min-h-screen bg-white text-ink">
      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-line">
        <div className="flex items-center justify-between px-6 sm:px-10 h-16">
          <div className="flex items-center gap-9">
            <Logo onClick={() => { setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
            <div className="hidden md:flex items-center gap-7">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} className="text-[15px] font-medium text-ink-sub hover:text-ink transition-colors">{l.label}</a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {/* Hamburger — mobile only */}
            <button
              type="button"
              aria-label={menuOpen ? t('nav.menuClose') : t('nav.menuOpen')}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 -mr-2 rounded-lg text-ink-sub hover:bg-surface transition-colors"
            >
              {menuOpen ? (
                <Icon name="x" size={22} />
              ) : (
                <span className="flex flex-col gap-[5px]">
                  <span className="block w-5 h-[2px] rounded-full bg-current" />
                  <span className="block w-5 h-[2px] rounded-full bg-current" />
                  <span className="block w-5 h-[2px] rounded-full bg-current" />
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-line bg-white px-6 py-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block py-3.5 text-[16px] font-medium text-ink-sub hover:text-ink transition-colors border-b border-line last:border-0"
              >
                {l.label}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden">
        {/* <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] -z-10" style={{ background: 'radial-gradient(60% 100% at 50% 0%, #eaf2fe 0%, rgba(255,255,255,0) 70%)' }} /> */}
        {/* <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[560px] -z-0"
          style={{
            background:
              'radial-gradient(50% 120% at 50% 0%, rgba(49,130,246,0.18) 0%, rgba(255,255,255,0) 60%)',
          }}
        /> */}
        <div className="max-w-5xl mx-auto px-6 pt-20 relative z-10 sm:pt-24 pb-12 text-center flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-soft border border-line text-[12.5px] font-semibold text-ink-sub shadow-[0px_1px_3px_rgba(0,0,0,0.05)]">
            <span className="text-brand"><Icon name="shield" size={14} /></span>
            {t('hero.badge')}
          </div>
          <h1 className="text-[40px] sm:text-[60px] font-extrabold tracking-tight leading-[1.08]">
            {t('hero.titleLine1')}
            <br />
            <span className="text-brand">{t('hero.titleHighlight')}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[18px] sm:text-[20px] text-ink-sub leading-relaxed break-keep [text-wrap:balance]">
            {t('hero.subtitle1')}
          </p>
          <p className="mt-2 max-w-2xl text-[18px] sm:text-[20px] text-ink-sub leading-relaxed break-keep [text-wrap:balance]">
            {t('hero.subtitle2')}
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <Button size="lg" rightIcon="arrow-right" onClick={() => navigate('/signup')}>{t('hero.ctaStart')}</Button>
            <Button size="lg" variant="weak" leftIcon="bar-chart-2" onClick={() => { document.getElementById('benchmark')?.scrollIntoView({ behavior: 'smooth' }) }}>{t('hero.ctaBenchmark')}</Button>
          </div>
          <p className="mt-4 text-[13px] text-ink-muted">{t('hero.note')}</p>
        </div>

        <div className="max-w-4xl mx-auto px-6 pb-[120px]">
          <ReportPreview />
        </div>
      </header>

      {/* Stats */}
      <section className="py-16 sm:py-20 border-y border-line bg-surface">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-[34px] sm:text-[44px] font-extrabold tracking-tight tnum">{s.value}</p>
              <p className="mt-2 text-[14.5px] text-ink-sub break-keep">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benchmark */}
      <section id="benchmark" className="py-[120px] px-6">
        <div className="max-w-5xl mx-auto">
          <SectionHeading tag={t('benchmark.tag')} title={t('benchmark.title')} sub={t('benchmark.sub')} />
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl bg-ink p-7 flex flex-col self-start">
              <div>
                <p className="text-base font-bold text-white flex items-center gap-2"><Icon name="trending-down" size={18} /> {t('benchmark.card1.title')}</p>
                <p className="text-[13px] text-ink-faint mt-2 leading-relaxed">{t('benchmark.card1.desc')}</p>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white/10 border border-brand/40 p-5">
                  <p className="text-[13px] text-brand-soft font-semibold">{t('benchmark.card1.scanopsLabel')}</p>
                  <p className="text-[36px] font-extrabold text-white mt-1.5 tnum leading-none">{t('benchmark.card1.vulnerableValue')}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-5">
                  <p className="text-[13px] text-ink-faint font-semibold">{t('benchmark.card1.commercialLabel')}</p>
                  <p className="text-[36px] font-extrabold text-ink-faint mt-1.5 tnum leading-none">{t('benchmark.card1.safeValue')}</p>
                </div>
              </div>
              <p className="mt-6 text-[12.5px] text-ink-faint leading-relaxed">{t('benchmark.card1.footnote')}</p>
            </div>
            <div className="rounded-2xl bg-white border border-line p-7 flex flex-col">
              <p className="text-base font-bold text-ink mb-1">{t('benchmark.card2.title')}</p>
              <p className="text-[13px] text-ink-muted mb-5 leading-relaxed">{t('benchmark.card2.desc')}</p>
              <div className="flex flex-col gap-3">
                {[
                  [t('benchmark.card2.steps.staticAnalysis'), t('benchmark.card2.badges.staticAnalysis')],
                  [t('benchmark.card2.steps.semanticReview'), t('benchmark.card2.badges.semanticReview')],
                  [t('benchmark.card2.steps.resultMerge'), t('benchmark.card2.badges.resultMerge')],
                ].map(([step, badge]) => (
                  <div key={step} className="flex items-center gap-3 rounded-xl bg-surface border border-line px-4 py-3">
                    <span className="text-success shrink-0"><Icon name="check-circle" size={18} /></span>
                    <span className="text-[14px] font-semibold text-ink">{step}</span>
                    <span className="ml-auto text-[12px] font-semibold text-ink-muted">{badge}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 pt-5 border-t border-line text-[13px] text-ink-sub leading-relaxed font-medium">{t('benchmark.card2.footer')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why security-specialized */}
      <section id="why" className="py-[120px] px-6 bg-surface border-y border-line">
        <div className="max-w-5xl mx-auto">
          <SectionHeading tag={t('why.tag')} title={t('why.title')} sub={t('why.sub')} />
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {whyCards.map((c) => (
              <div key={c.title} className="rounded-2xl bg-white border border-line p-7">
                <div className="w-12 h-12 rounded-xl bg-brand-soft text-brand flex items-center justify-center mb-5"><Icon name={c.icon} size={22} /></div>
                <h3 className="font-bold text-[18px] mb-2">{c.title}</h3>
                <p className="text-[15px] text-ink-muted leading-relaxed break-keep">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code security */}
      <section id="security" className="py-[120px] px-6">
        <div className="max-w-5xl mx-auto">
          <SectionHeading tag={t('security.tag')} title={t('security.title')} sub={t('security.sub')} />
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <FlowCard
              badge={t('security.flow1.badge')}
              color="var(--color-brand)"
              soft="var(--color-brand-soft)"
              title={t('security.flow1.title')}
              steps={t('security.flow1.steps', { returnObjects: true }) as string[]}
              note={t('security.flow1.note')}
            />
            <FlowCard
              badge={t('security.flow2.badge')}
              color="var(--color-scan-code)"
              soft="var(--color-purple-soft)"
              title={t('security.flow2.title')}
              steps={t('security.flow2.steps', { returnObjects: true }) as string[]}
              note={t('security.flow2.note')}
            />
          </div>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {([
              ['cpu', t('security.features.memoryOnly.title'), t('security.features.memoryOnly.desc')],
              ['trash-2', t('security.features.immediateDeletion.title'), t('security.features.immediateDeletion.desc')],
              ['key', t('security.features.readOnly.title'), t('security.features.readOnly.desc')],
              ['lock', t('security.features.httpsEncryption.title'), t('security.features.httpsEncryption.desc')],
            ] as [IconName, string, string][]).map(([icon, title, d]) => (
              <div key={title} className="rounded-xl bg-surface border border-line px-4 py-4">
                <div className="text-ink-sub mb-2"><Icon name={icon} size={20} /></div>
                <p className="text-[13.5px] font-semibold text-ink">{title}</p>
                <p className="text-[12px] text-ink-muted mt-0.5 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scan modes */}
      <section className="py-[120px] px-6 bg-surface border-y border-line">
        <div className="max-w-5xl mx-auto">
          <SectionHeading tag={t('scanModes.tag')} title={t('scanModes.title')} sub={t('scanModes.sub')} />
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {scanModes.map((m) => (
              <div key={m.tag} className="rounded-2xl bg-white border border-line p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: m.soft, color: m.accent }}><Icon name={m.icon} size={21} /></div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: m.soft, color: m.accent }}>{m.tag}</span>
                </div>
                <h3 className="font-bold text-[17px] mb-1.5">{m.title}</h3>
                <p className="text-[14.5px] text-ink-muted leading-relaxed break-keep">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      {ENABLE_PRICING && (
        <section id="pricing" className="py-[120px] px-6">
          <div className="max-w-5xl mx-auto">
            <SectionHeading tag={t('pricing.tag')} title={t('pricing.title')} sub={t('pricing.sub')} />
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              {plans.map((p) => (
                <div key={p.name} className={`rounded-2xl bg-white p-6 flex flex-col ${p.primary ? 'border-2 border-brand' : 'border border-line'}`}>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{p.name}</h3>
                    {p.primary && <span className="px-2 py-0.5 rounded-full bg-brand text-white text-[11px] font-bold">{t('pricing.popular')}</span>}
                  </div>
                  <p className="mt-1 text-[13px] text-ink-muted">{p.desc}</p>
                  <div className="mt-4 flex items-baseline gap-0.5">
                    <span className="text-[28px] font-bold tracking-tight tnum">{p.price}</span>
                    <span className="text-sm text-ink-muted font-medium">{p.per}</span>
                  </div>
                  <Button variant={p.primary ? 'primary' : 'outline'} block className="mt-5" onClick={() => navigate('/signup')}>
                    {p.name === 'Free' ? t('pricing.ctaFree') : t('pricing.ctaStart', { name: p.name })}
                  </Button>
                  <ul className="mt-5 flex flex-col gap-2.5">
                    {p.feats.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-[13px] text-ink-sub">
                        <span className="text-success"><Icon name="check" size={14} strokeWidth={3} /></span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <button onClick={() => navigate('/pricing')} className="text-brand text-sm font-semibold hover:underline inline-flex items-center gap-1">
                {t('pricing.compareLink')} <Icon name="arrow-right" size={15} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* GitHub App CTA */}
      <section className="py-[120px] px-6 bg-surface border-y border-line">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-soft text-purple text-xs font-bold">
            <Icon name="github" size={14} /> {t('githubCta.badge')}
          </div>
          <h2 className="text-[32px] sm:text-[40px] font-bold mb-5 leading-[1.15] break-keep">{t('githubCta.titleBefore')}<span className="text-purple">{t('githubCta.titleHighlight')}</span>{t('githubCta.titleAfter')}</h2>
          <p className="text-ink-sub text-[17px] sm:text-[18px] leading-relaxed mb-9 break-keep">
            {t('githubCta.desc')}
          </p>
          <Button size="lg" variant="dark" leftIcon="github" onClick={() => navigate('/signup')}>{t('githubCta.cta')}</Button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-[120px]">
        <div className="max-w-5xl mx-auto rounded-3xl bg-ink px-8 py-16 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-0" style={{ background: 'radial-gradient(50% 120% at 50% 0%, rgba(49,130,246,0.25) 0%, rgba(0,0,0,0) 60%)' }} />
          <div className="relative">
            <h2 className="text-[32px] sm:text-[42px] font-bold text-white leading-[1.15] break-keep">{t('finalCta.title')}</h2>
            <p className="mt-4 text-[17px] sm:text-[18px] text-ink-faint break-keep">{t('finalCta.subtitle')}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate('/signup')} rightIcon="arrow-right">{t('finalCta.ctaStart')}</Button>
              <Button size="lg" variant="weak" onClick={() => navigate('/login')} className="!bg-white/10 !text-white hover:!bg-white/20">{t('finalCta.ctaLogin')}</Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-ink-faint border-t border-line">{t('footer.copyright')}</footer>
    </div>
  )
}

// ── sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ tag, title, sub }: { tag: string; title: string; sub: string }) {
  return (
    <div className="text-center flex flex-col items-center">
      <span className="px-3 py-1.5 rounded-full bg-brand-soft text-brand text-[13px] font-bold mb-4">{tag}</span>
      <h2 className="text-[32px] sm:text-[44px] font-bold tracking-tight leading-[1.15] break-keep">{title}</h2>
      <p className="mt-4 max-w-2xl text-ink-sub text-[17px] sm:text-[19px] leading-relaxed break-keep">{sub}</p>
    </div>
  )
}


function FlowCard({ badge, color, soft, title, steps, note }: { badge: string; color: string; soft: string; title: string; steps: string[]; note: string }) {
  return (
    <div className="rounded-2xl bg-white border border-line p-7">
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: soft, color }}>{badge}</span>
      <h3 className="mt-4 font-bold text-lg">{title}</h3>
      <div className="mt-5 flex flex-col gap-2.5">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: soft, color }}>{i + 1}</span>
            <span className="text-[14.5px] text-ink-sub">{s}</span>
          </div>
        ))}
      </div>
      <p className="mt-5 pt-4 border-t border-line text-[12.5px] font-semibold flex items-center gap-1.5" style={{ color }}>
        <Icon name="check-circle" size={14} /> {note}
      </p>
    </div>
  )
}

function ReportPreview() {
  const { t } = useTranslation('landing')

  const summary = [
    { label: t('reportPreview.summary.vulnerabilities'), value: t('reportPreview.summary.vulnerabilitiesValue'), color: 'var(--color-ink)' },
    { label: t('reportPreview.summary.maxCvss'), value: '9.8', color: 'var(--color-sev-critical)' },
    { label: 'Critical', value: t('reportPreview.summary.criticalValue'), color: 'var(--color-sev-critical)' },
    { label: 'High', value: t('reportPreview.summary.highValue'), color: 'var(--color-sev-high)' },
  ]
  const vulns: { sev: string; color: string; bg: string; cvss: string; name: string; loc: string }[] = [
    { sev: 'Critical', color: 'var(--color-sev-critical)', bg: '#fde7e9', cvss: '9.8', name: 'SQL Injection', loc: 'POST /api/login → username' },
    { sev: 'High', color: 'var(--color-sev-high)', bg: 'var(--color-danger-soft)', cvss: '7.4', name: 'Reflected XSS', loc: 'GET /search → q' },
    { sev: 'Medium', color: 'var(--color-sev-medium)', bg: 'var(--color-warning-soft)', cvss: '5.9', name: 'Weak Crypto', loc: 'CryptoUtil.encrypt()' },
  ]
  return (
    <div className="rounded-2xl bg-white border border-line shadow-[0_24px_60px_-20px_rgba(25,31,40,0.18)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-line bg-surface">
        <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        <div className="ml-3 flex-1 max-w-xs h-6 rounded-md bg-white border border-line flex items-center px-3">
          <span className="text-[11px] text-ink-muted">app.scanops.io/report</span>
        </div>
      </div>
      <div className="p-5 sm:p-7 text-left">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded-full bg-brand-soft text-brand text-[11px] font-bold">DAST</span>
          <span className="text-[12px] text-ink-muted">{t('reportPreview.scanCompleted', { date: '2026.06.27' })}</span>
        </div>
        <p className="text-lg font-bold text-ink">https://shop.example.com</p>

        <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-2.5">
          {summary.map((s) => (
            <div key={s.label} className="rounded-xl bg-surface border border-line px-2 py-2.5 sm:px-3 sm:py-3">
              <p className="text-[10.5px] sm:text-[11px] text-ink-muted font-medium">{s.label}</p>
              <p className="text-[16px] sm:text-xl font-bold mt-0.5 tnum" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg bg-brand-soft px-3 py-2.5">
          <span className="text-brand"><Icon name="shield" size={15} /></span>
          <span className="text-[12.5px] text-brand font-medium">{t('reportPreview.privacyNote')}</span>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {vulns.map((v) => (
            <div key={v.name} className="flex items-center gap-3 rounded-xl bg-white border border-line px-3.5 py-3">
              <div className="w-11 h-11 rounded-lg flex flex-col items-center justify-center shrink-0" style={{ background: v.bg }}>
                <span className="text-sm font-bold leading-none tnum" style={{ color: v.color }}>{v.cvss}</span>
                <span className="text-[8px] font-semibold mt-0.5" style={{ color: v.color }}>CVSS</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: v.bg, color: v.color }}>{v.sev}</span>
                  <span className="text-sm font-bold text-ink truncate">{v.name}</span>
                </div>
                <p className="text-[12px] text-ink-muted mt-0.5 truncate">{v.loc}</p>
              </div>
              <span className="text-ink-faint shrink-0"><Icon name="chevron-right" size={16} /></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

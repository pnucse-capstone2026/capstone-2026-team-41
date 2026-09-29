import { useTranslation } from 'react-i18next'
import { PLANS, planById, MODE_META, type PlanId, type ScanMode } from './mock'

/** Localized display text for a plan (desc/dast/sastActions/highlight/trial). Numeric/id fields come straight from `mock.ts`. */
export function usePlanText(id: PlanId) {
  const { t } = useTranslation('common')
  const base = planById(id)
  return {
    ...base,
    desc: t(`plans.${id}.desc`),
    dast: t(`plans.${id}.dast`),
    sastActions: t(`plans.${id}.sastActions`),
    highlight: t(`plans.${id}.highlight`),
    trial: base.trial ? t(`plans.${id}.trial`) : undefined,
  }
}

/** All plans with localized display text, in catalog order. */
export function usePlansText() {
  const { t } = useTranslation('common')
  return PLANS.map((p) => ({
    ...p,
    desc: t(`plans.${p.id}.desc`),
    dast: t(`plans.${p.id}.dast`),
    sastActions: t(`plans.${p.id}.sastActions`),
    highlight: t(`plans.${p.id}.highlight`),
    trial: p.trial ? t(`plans.${p.id}.trial`) : undefined,
  }))
}

/** Localized scan-mode label (tag/color/icon are language-independent, use MODE_META directly). */
export function useModeLabel(mode: ScanMode) {
  const { t } = useTranslation('common')
  return t(`modes.${mode}.label`)
}

export { MODE_META }

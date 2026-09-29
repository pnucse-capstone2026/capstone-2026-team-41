import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import commonEn from './locales/en/common.json'
import landingEn from './locales/en/landing.json'
import authEn from './locales/en/auth.json'
import onboardingEn from './locales/en/onboarding.json'
import dashboardEn from './locales/en/dashboard.json'
import scanEn from './locales/en/scan.json'
import reportEn from './locales/en/report.json'
import reportsEn from './locales/en/reports.json'
import integrationsEn from './locales/en/integrations.json'
import mypageEn from './locales/en/mypage.json'
import settingsEn from './locales/en/settings.json'
import teamEn from './locales/en/team.json'
import surveyEn from './locales/en/survey.json'
import pricingEn from './locales/en/pricing.json'
import checkoutEn from './locales/en/checkout.json'

import commonKo from './locales/ko/common.json'
import landingKo from './locales/ko/landing.json'
import authKo from './locales/ko/auth.json'
import onboardingKo from './locales/ko/onboarding.json'
import dashboardKo from './locales/ko/dashboard.json'
import scanKo from './locales/ko/scan.json'
import reportKo from './locales/ko/report.json'
import reportsKo from './locales/ko/reports.json'
import integrationsKo from './locales/ko/integrations.json'
import mypageKo from './locales/ko/mypage.json'
import settingsKo from './locales/ko/settings.json'
import teamKo from './locales/ko/team.json'
import surveyKo from './locales/ko/survey.json'
import pricingKo from './locales/ko/pricing.json'
import checkoutKo from './locales/ko/checkout.json'

export const SUPPORTED_LANGUAGES = ['ko', 'en'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: commonEn,
        landing: landingEn,
        auth: authEn,
        onboarding: onboardingEn,
        dashboard: dashboardEn,
        scan: scanEn,
        report: reportEn,
        reports: reportsEn,
        integrations: integrationsEn,
        mypage: mypageEn,
        settings: settingsEn,
        team: teamEn,
        survey: surveyEn,
        pricing: pricingEn,
        checkout: checkoutEn,
      },
      ko: {
        common: commonKo,
        landing: landingKo,
        auth: authKo,
        onboarding: onboardingKo,
        dashboard: dashboardKo,
        scan: scanKo,
        report: reportKo,
        reports: reportsKo,
        integrations: integrationsKo,
        mypage: mypageKo,
        settings: settingsKo,
        team: teamKo,
        survey: surveyKo,
        pricing: pricingKo,
        checkout: checkoutKo,
      },
    },
    ns: [
      'common', 'landing', 'auth', 'onboarding', 'dashboard', 'scan', 'report', 'reports',
      'integrations', 'mypage', 'settings', 'team', 'survey', 'pricing', 'checkout',
    ],
    defaultNS: 'common',
    fallbackLng: 'ko',
    supportedLngs: SUPPORTED_LANGUAGES,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'scanops_lang',
    },
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  })

export default i18n

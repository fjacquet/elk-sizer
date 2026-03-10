import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import {
  DEFAULT_LANGUAGE,
  DEFAULT_NAMESPACE,
  NAMESPACES,
  STORAGE_KEY,
  SUPPORTED_LANGUAGES,
} from './config'
import deAdvanced from './locales/de/advanced.json'
import deAdvisor from './locales/de/advisor.json'
import deCommon from './locales/de/common.json'
import deDeployment from './locales/de/deployment.json'
import deGuide from './locales/de/guide.json'
import deIngest from './locales/de/ingest.json'
import deOutput from './locales/de/output.json'
import dePdf from './locales/de/pdf.json'
import dePerformance from './locales/de/performance.json'
import deRetention from './locales/de/retention.json'
import enAdvanced from './locales/en/advanced.json'
import enAdvisor from './locales/en/advisor.json'
import enCommon from './locales/en/common.json'
import enDeployment from './locales/en/deployment.json'
import enGuide from './locales/en/guide.json'
import enIngest from './locales/en/ingest.json'
import enOutput from './locales/en/output.json'
import enPdf from './locales/en/pdf.json'
import enPerformance from './locales/en/performance.json'
import enRetention from './locales/en/retention.json'
import frAdvanced from './locales/fr/advanced.json'
import frAdvisor from './locales/fr/advisor.json'
import frCommon from './locales/fr/common.json'
import frDeployment from './locales/fr/deployment.json'
import frGuide from './locales/fr/guide.json'
import frIngest from './locales/fr/ingest.json'
import frOutput from './locales/fr/output.json'
import frPdf from './locales/fr/pdf.json'
import frPerformance from './locales/fr/performance.json'
import frRetention from './locales/fr/retention.json'
import itAdvanced from './locales/it/advanced.json'
import itAdvisor from './locales/it/advisor.json'
import itCommon from './locales/it/common.json'
import itDeployment from './locales/it/deployment.json'
import itGuide from './locales/it/guide.json'
import itIngest from './locales/it/ingest.json'
import itOutput from './locales/it/output.json'
import itPdf from './locales/it/pdf.json'
import itPerformance from './locales/it/performance.json'
import itRetention from './locales/it/retention.json'

const resources = {
  en: {
    common: enCommon,
    ingest: enIngest,
    retention: enRetention,
    performance: enPerformance,
    deployment: enDeployment,
    advanced: enAdvanced,
    output: enOutput,
    pdf: enPdf,
    guide: enGuide,
    advisor: enAdvisor,
  },
  fr: {
    common: frCommon,
    ingest: frIngest,
    retention: frRetention,
    performance: frPerformance,
    deployment: frDeployment,
    advanced: frAdvanced,
    output: frOutput,
    pdf: frPdf,
    guide: frGuide,
    advisor: frAdvisor,
  },
  de: {
    common: deCommon,
    ingest: deIngest,
    retention: deRetention,
    performance: dePerformance,
    deployment: deDeployment,
    advanced: deAdvanced,
    output: deOutput,
    pdf: dePdf,
    guide: deGuide,
    advisor: deAdvisor,
  },
  it: {
    common: itCommon,
    ingest: itIngest,
    retention: itRetention,
    performance: itPerformance,
    deployment: itDeployment,
    advanced: itAdvanced,
    output: itOutput,
    pdf: itPdf,
    guide: itGuide,
    advisor: itAdvisor,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    defaultNS: DEFAULT_NAMESPACE,
    ns: NAMESPACES,

    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: true,
    },
  })

export default i18n

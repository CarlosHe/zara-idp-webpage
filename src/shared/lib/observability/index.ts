export {
  _resetSentryForTests,
  _setSentryLoaderForTests,
  addBreadcrumb,
  initSentry,
  isSentryInitialized,
  logErrorToService,
} from './sentry';
export { reportWebVitals, sendToAnalytics, serializeMetric, subscribeToWebVitals } from './webVitals';
export type { VitalsReporter } from './webVitals';

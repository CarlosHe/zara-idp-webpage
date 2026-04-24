import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App'
import { initSentry, reportWebVitals } from '@/shared/lib/observability'

// Sentry init is a no-op when `VITE_SENTRY_DSN` is missing (dev, tests),
// so it's safe to call unconditionally. Must run before React renders so
// the first paint's errors get captured.
initSentry()

// Web Vitals post asynchronously and never block rendering. The default
// reporter POSTs to `VITE_ANALYTICS_ENDPOINT` when set, otherwise logs
// to the console in dev so developers can eyeball regressions.
reportWebVitals()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

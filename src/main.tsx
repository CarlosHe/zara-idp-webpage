import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app/App';

// Mount React first so the user sees pixels ASAP. Sentry + Web Vitals
// are loaded asynchronously after first paint so they stay out of the
// initial JS budget — they're still installed before any non-initial
// route transition, so breadcrumbs + vitals capture the full session.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

const bootObservability = () => {
  void import('@/shared/lib/observability').then(({ initSentry, reportWebVitals }) => {
    initSentry();
    reportWebVitals();
  });
};

if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
  (window as Window & typeof globalThis).requestIdleCallback(bootObservability, {
    timeout: 2000,
  });
} else {
  setTimeout(bootObservability, 0);
}

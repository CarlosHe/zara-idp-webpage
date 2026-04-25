import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './providers';
import { router } from './router';
import { VitalsDebugPanel } from '@/shared/lib/observability/VitalsDebugPanel';
import { addBreadcrumb } from '@/shared/lib/observability';

router.subscribe((state) => {
  addBreadcrumb({
    category: 'navigation',
    level: 'info',
    message: 'route changed',
    data: {
      location: state.location.pathname,
    },
  });
});

function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
      <VitalsDebugPanel />
    </AppProviders>
  );
}

export default App;

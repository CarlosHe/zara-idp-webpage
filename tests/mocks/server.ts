import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Single MSW server shared across the suite. `tests/setup.ts` calls
// `.listen()` / `.resetHandlers()` / `.close()` at the right lifecycle
// hooks — specs import this file only when they need to override a
// handler via `server.use(...)`.
export const server = setupServer(...handlers);

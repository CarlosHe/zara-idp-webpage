import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Sprint 7 (L-707): every data fetch must flow through
      // `@/shared/lib/api` (RTK Query). Keeps the 401/403 + correlation-id
      // + retry behaviour consistent and prevents re-introducing a second
      // HTTP client alongside fetchBaseQuery.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'axios',
              message:
                'Axios is removed. Use RTK Query via `@/shared/lib/api` (see `.claude/docs/front/04-DATA-FETCHING.md`).',
            },
          ],
          patterns: [
            {
              group: ['axios/*'],
              message:
                'Axios is removed. Use RTK Query via `@/shared/lib/api` (see `.claude/docs/front/04-DATA-FETCHING.md`).',
            },
          ],
        },
      ],
      // Sprint 8 (L-808): forbid inline `style={...}` JSX attributes. The
      // only legit cases are dynamic CSS values that Tailwind cannot
      // compile (e.g. `width: ${computed}%`). Each such site must
      // escape-hatch with `// eslint-disable-next-line no-restricted-syntax`
      // and a one-line comment explaining *why* the value is dynamic.
      // Rationale: static styling belongs in Tailwind utilities + CVA so
      // design tokens (dark-mode, theming) apply consistently.
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='style']",
          message:
            'Use Tailwind utilities / CVA variants instead of inline `style={...}`. For legit dynamic values (e.g. width/height %) add `// eslint-disable-next-line no-restricted-syntax` with a justification — see `.claude/docs/front/12-STYLING.md`.',
        },
      ],
    },
  },
])

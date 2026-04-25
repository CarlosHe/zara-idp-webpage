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
      // CVA `*Variants` functions and constants live alongside the
      // component they style (shadcn/ui convention). Fast-refresh still
      // works thanks to `allowConstantExport`.
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
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
        // Target inline object literals only: `style={{ ... }}`. This
        // lets us pass `style={rowStyle}` from libraries that compute
        // absolute positions at runtime (react-window, animation engines)
        // without fighting the rule every row.
        {
          selector:
            "JSXAttribute[name.name='style'] > JSXExpressionContainer > ObjectExpression",
          message:
            'Use Tailwind utilities / CVA variants instead of inline `style={{...}}`. For legit dynamic values (e.g. width/height %) add `// eslint-disable-next-line no-restricted-syntax` with a justification — see `.claude/docs/front/12-STYLING.md`.',
        },
        // Sprint 10 (L-1009): bitmap <img> without alt and loading fails
        // accessibility (WCAG 1.1.1) and hurts LCP. The rule forces both
        // attributes on the JSX element; decorative images use alt="" +
        // aria-hidden. Use lucide-react SVG icons whenever possible.
        {
          selector: "JSXOpeningElement[name.name='img']:not(:has(JSXAttribute[name.name='alt']))",
          message:
            '<img> needs an explicit `alt` (empty string + `aria-hidden` for decorative images). See `.claude/docs/front/13-ACCESSIBILITY.md`.',
        },
        {
          selector: "JSXOpeningElement[name.name='img']:not(:has(JSXAttribute[name.name='loading']))",
          message:
            '<img> needs a `loading` attribute (`lazy` below the fold, `eager` for LCP). See `.claude/docs/front/10-PERFORMANCE.md`.',
        },
        // Sprint 11 (L-1106): never render server HTML directly. Audit
        // entries, changeset diffs, and policy descriptions must flow
        // through `@/shared/lib/security/sanitize.ts` (DOMPurify) and
        // be rendered as escaped React text or via a vetted markdown
        // renderer. This rule prevents stored-XSS regressions even if
        // the server is ever compromised. See
        // `.claude/docs/front/15-CONTENT-SECURITY.md`.
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message:
            'Never use dangerouslySetInnerHTML. Sanitize via `@/shared/lib/security/sanitize.ts` (DOMPurify) or render escaped React text. See `.claude/docs/front/15-CONTENT-SECURITY.md`.',
        },
        // Sprint 11 (L-1106): inline DOM script tags bypass the CSP
        // `script-src 'self'` directive and reintroduce the XSS surface
        // we just removed. Module scripts injected by Vite at build
        // time are placed by the bundler and aren't subject to this
        // rule (they're file-imported, not inline JSX).
        {
          selector: "JSXElement > JSXOpeningElement[name.name='script']",
          message:
            'Inline <script> bypasses CSP. Move logic to a TS module imported via the bundler. See `.claude/docs/front/15-CONTENT-SECURITY.md`.',
        },
      ],
    },
  },
])

import type { Config } from 'tailwindcss';

// Tailwind v4 is CSS-first: the source-of-truth for design tokens, the
// `dark` variant and the content scan all live in `src/index.css` via
// `@theme`, `@custom-variant dark` and Vite auto-discovery. This file
// exists as explicit documentation so a new contributor has a single
// place to ask "what Tailwind knobs is this project using?".
//
// If a plugin or content override is ever needed, it goes here and the
// CSS imports it with `@config "../tailwind.config.ts"` — only then.
const config: Config = {
  // Empty: v4 auto-detects source files. Keep for IDE autocompletion.
  content: [],
  theme: {},
  plugins: [],
};

export default config;

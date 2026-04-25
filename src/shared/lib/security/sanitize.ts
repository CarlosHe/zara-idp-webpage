// Sprint 11 / L-1106: HTML sanitisation surface for the Zara IDP UI.
//
// Today the app renders every server-provided string as escaped React
// text — there is exactly zero `dangerouslySetInnerHTML` usage and an
// ESLint rule (eslint.config.js, no-restricted-syntax block) keeps it
// that way. This module ships the canonical sanitiser anyway so any
// future feature that *needs* to render rich HTML (audit-detail diff,
// markdown changelog, plugin tab) goes through one vetted path.
//
// `sanitizeHtml` returns a string suitable to feed into a future
// `dangerouslySetInnerHTML` attribute. Every callsite that uses it
// must (a) lint-disable the rule with a justification, (b) call this
// helper, and (c) document the input source in a code comment.
//
// See .claude/docs/front/15-CONTENT-SECURITY.md.

import DOMPurify, { type Config } from 'dompurify';

// The default `RETURN_TRUSTED_TYPE` flag is `false`, which makes the
// output a plain string. This keeps the helper portable to SSR / tests
// (jsdom) where TrustedTypes aren't available.
const PROFILE: Config = {
  USE_PROFILES: { html: true },
  // Hard-stop the obvious script vectors. DOMPurify removes these by
  // default; we set them explicitly so a future config drift doesn't
  // silently re-enable them.
  FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'link', 'meta'],
  FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'srcdoc', 'formaction'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
};

export interface SanitizeOptions {
  /**
   * If true, only inline tags survive — block-level elements are
   * stripped (handy for short user-attributable strings like commit
   * messages or audit-log diff hunks).
   */
  inlineOnly?: boolean;
}

/**
 * Returns a DOMPurify-cleaned HTML string. The output is safe to feed
 * into React's `dangerouslySetInnerHTML`, but the `dangerously*` API
 * is forbidden by ESLint so callers must document the carve-out.
 *
 * Empty / nullish inputs return an empty string.
 */
export function sanitizeHtml(input: string | null | undefined, opts?: SanitizeOptions): string {
  if (!input) return '';
  if (opts?.inlineOnly) {
    const inlineConfig: Config = {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'br', 'span', 'a'],
      ALLOWED_ATTR: ['href', 'rel', 'target'],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      RETURN_TRUSTED_TYPE: false,
    };
    return DOMPurify.sanitize(input, inlineConfig) as string;
  }
  return DOMPurify.sanitize(input, { ...PROFILE, RETURN_TRUSTED_TYPE: false }) as string;
}

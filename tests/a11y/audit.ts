// Sprint-32 / L-3204 — lightweight in-tree accessibility auditor.
//
// Why a homegrown audit and not axe-core? axe-core is the obvious
// choice but it pulls in 1.6 MB of evaluators and a real browser, and
// even the Node-only `jest-axe` adapter fights jsdom for the layout
// it cannot compute. The control plane already ratchets bundle size
// and dependency surface — adding a heavy dev dep for a single
// purpose was rejected by Sprint 30 review.
//
// Instead, this module implements a small set of WCAG 2.2 AA rules
// that *can* be evaluated reliably in jsdom, classified by severity:
// `critical` (legal/blocker), `serious` (always wrong), `moderate`
// (style guide). Sprint 32 budget: zero `critical` and zero
// `serious` on the seven major routes that are part of the user
// journey matrix.
//
// Rules implemented (all evaluated against the rendered subtree):
//
//   - **landmark-one-main** (critical): exactly one `<main>` or
//     `[role=main]` element. Without it, screen readers cannot skip
//     navigation to the page content.
//   - **heading-order** (serious): the first heading must be `h1`,
//     and subsequent headings must not skip levels.
//   - **interactive-name** (critical): every interactive control
//     (`<button>`, `<a href>`, native form input, anything with role
//     `button`/`link`/`tab`) must expose an accessible name through
//     text content, `aria-label`, `aria-labelledby`, `<label>`, or
//     `title`.
//   - **image-alt** (critical): every `<img>` must have an `alt`
//     attribute (empty string allowed for decorative images).
//   - **positive-tabindex** (serious): `tabindex` may be `-1` or
//     `0`; a positive value forces a non-DOM order and breaks
//     keyboard users.
//   - **aria-role-known** (serious): if `role` is set, it must be a
//     canonical ARIA role.
//
// The auditor returns the list of violations; tests typically assert
// that the count of `critical` + `serious` violations is zero.

export type Severity = 'critical' | 'serious' | 'moderate';

export interface Violation {
  id: string;
  severity: Severity;
  message: string;
  target: string;
}

const KNOWN_ARIA_ROLES = new Set([
  'alert',
  'alertdialog',
  'application',
  'article',
  'banner',
  'button',
  'cell',
  'checkbox',
  'columnheader',
  'combobox',
  'complementary',
  'contentinfo',
  'definition',
  'dialog',
  'directory',
  'document',
  'feed',
  'figure',
  'form',
  'grid',
  'gridcell',
  'group',
  'heading',
  'img',
  'link',
  'list',
  'listbox',
  'listitem',
  'log',
  'main',
  'marquee',
  'math',
  'menu',
  'menubar',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'meter',
  'navigation',
  'none',
  'note',
  'option',
  'presentation',
  'progressbar',
  'radio',
  'radiogroup',
  'region',
  'row',
  'rowgroup',
  'rowheader',
  'scrollbar',
  'search',
  'searchbox',
  'separator',
  'slider',
  'spinbutton',
  'status',
  'switch',
  'tab',
  'table',
  'tablist',
  'tabpanel',
  'term',
  'textbox',
  'timer',
  'toolbar',
  'tooltip',
  'tree',
  'treegrid',
  'treeitem',
]);

function describeTarget(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const cls =
    typeof el.className === 'string' && el.className.trim()
      ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
      : '';
  return `${tag}${id}${cls}`.slice(0, 80);
}

function accessibleName(el: Element): string {
  const aria = el.getAttribute('aria-label');
  if (aria && aria.trim()) return aria.trim();
  const labelledby = el.getAttribute('aria-labelledby');
  if (labelledby) {
    const ref = el.ownerDocument.getElementById(labelledby);
    if (ref?.textContent?.trim()) return ref.textContent.trim();
  }
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
    const input = el as HTMLInputElement;
    if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') {
      return input.value?.trim() ?? '';
    }
    if (input.id) {
      const lbl = el.ownerDocument.querySelector(`label[for="${CSS.escape(input.id)}"]`);
      if (lbl?.textContent?.trim()) return lbl.textContent.trim();
    }
    if (input.placeholder?.trim()) return input.placeholder.trim();
  }
  if (el.textContent?.trim()) return el.textContent.trim();
  const title = el.getAttribute('title');
  if (title?.trim()) return title.trim();
  return '';
}

function isInteractive(el: Element): boolean {
  const tag = el.tagName;
  if (tag === 'BUTTON') return true;
  if (tag === 'A' && (el as HTMLAnchorElement).hasAttribute('href')) return true;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    const t = (el as HTMLInputElement).type;
    return t !== 'hidden';
  }
  const role = el.getAttribute('role');
  return role === 'button' || role === 'link' || role === 'tab' || role === 'menuitem';
}

export function audit(root: Element): Violation[] {
  const out: Violation[] = [];

  const mains = root.querySelectorAll('main, [role="main"]');
  if (mains.length === 0 && root.tagName !== 'MAIN') {
    // tests render isolated subtrees; only complain when an explicit
    // main is expected (root has been declared a "page-level" subtree
    // via a `data-page-root` marker — see auditPage()).
    if (root.hasAttribute('data-page-root')) {
      out.push({
        id: 'landmark-one-main',
        severity: 'critical',
        message: 'page-level subtree must declare exactly one <main>',
        target: describeTarget(root),
      });
    }
  } else if (mains.length > 1) {
    out.push({
      id: 'landmark-one-main',
      severity: 'critical',
      message: `expected exactly one <main>, found ${mains.length}`,
      target: describeTarget(mains[1]),
    });
  }

  // heading order
  const headings = Array.from(
    root.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6, [role="heading"]'),
  );
  let lastLevel = 0;
  let firstSeen = false;
  for (const h of headings) {
    let level = 0;
    if (h.tagName.startsWith('H')) {
      level = Number(h.tagName.charAt(1));
    } else {
      const aria = h.getAttribute('aria-level');
      level = aria ? Number(aria) : 0;
    }
    if (!Number.isFinite(level) || level < 1 || level > 6) continue;
    if (!firstSeen) {
      if (level !== 1) {
        out.push({
          id: 'heading-order',
          severity: 'serious',
          message: `first heading is h${level}; expected h1`,
          target: describeTarget(h),
        });
      }
      firstSeen = true;
    } else if (level > lastLevel + 1) {
      out.push({
        id: 'heading-order',
        severity: 'serious',
        message: `heading skipped from h${lastLevel} to h${level}`,
        target: describeTarget(h),
      });
    }
    lastLevel = level;
  }

  // interactive name
  const interactives = Array.from(root.querySelectorAll<HTMLElement>('*')).filter(
    (e) => isInteractive(e) && !e.hasAttribute('aria-hidden'),
  );
  for (const el of interactives) {
    if (!accessibleName(el)) {
      out.push({
        id: 'interactive-name',
        severity: 'critical',
        message: `${el.tagName.toLowerCase()} has no accessible name`,
        target: describeTarget(el),
      });
    }
  }

  // image alt
  const imgs = root.querySelectorAll<HTMLImageElement>('img');
  imgs.forEach((img) => {
    if (!img.hasAttribute('alt')) {
      out.push({
        id: 'image-alt',
        severity: 'critical',
        message: 'img must declare an alt attribute',
        target: describeTarget(img),
      });
    }
  });

  // positive tabindex
  const tabbables = root.querySelectorAll<HTMLElement>('[tabindex]');
  tabbables.forEach((el) => {
    const v = Number(el.getAttribute('tabindex'));
    if (Number.isFinite(v) && v > 0) {
      out.push({
        id: 'positive-tabindex',
        severity: 'serious',
        message: `tabindex=${v} forces non-DOM order`,
        target: describeTarget(el),
      });
    }
  });

  // aria role known
  const roled = root.querySelectorAll<HTMLElement>('[role]');
  roled.forEach((el) => {
    const role = el.getAttribute('role') ?? '';
    if (role && !KNOWN_ARIA_ROLES.has(role)) {
      out.push({
        id: 'aria-role-known',
        severity: 'serious',
        message: `unknown ARIA role "${role}"`,
        target: describeTarget(el),
      });
    }
  });

  return out;
}

/**
 * Audit a rendered page subtree. Adds the `data-page-root` marker so
 * the landmark rule fires; returns only `critical` + `serious`
 * violations because that is the Sprint 32 budget.
 */
export function auditPage(root: Element): Violation[] {
  root.setAttribute('data-page-root', 'true');
  return audit(root).filter(
    (v) => v.severity === 'critical' || v.severity === 'serious',
  );
}

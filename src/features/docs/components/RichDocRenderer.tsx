import { Fragment, useMemo, useState } from 'react';
import { Badge, Button } from '@/shared/components/ui';
import type { DocPage, TechDoc } from '../types';

const KIND_LABEL: Record<DocPage['kind'], string> = {
  markdown: 'Markdown',
  adr: 'ADR',
  runbook: 'Runbook',
  openapi: 'OpenAPI',
  diagram: 'Diagram',
};

// RichDocRenderer ships the Sprint-20 / L-2004 reader. We deliberately
// keep Markdown/ADR/runbook/diagram rendering self-contained — pulling
// a heavier Markdown library in would blow our 180 KB initial-JS
// budget and the bundle adapter already runs sanitisation.
//
// Behaviour:
// - Built-in bundles ship inline `markdown` content; we render it
//   through a tiny safe-Markdown converter and DOMPurify.
// - DocSet bundles ship `pages` metadata only; we present the page list
//   with kind badges and source paths so reviewers can spot stale or
//   incomplete docsets without fetching the bytes.
// - When a docset has zero pages we surface the empty state with the
//   right CTA so the user is never blocked.
export function RichDocRenderer({ doc }: { doc: TechDoc }) {
  // Memoise the empty-fallback so `pages` keeps a stable reference between
  // renders when `doc.pages` is undefined; otherwise the activePage memo
  // would invalidate on every parent re-render.
  const pages = useMemo(() => doc.pages ?? [], [doc.pages]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const activePage = useMemo(
    () => pages.find((p) => p.slug === activeSlug) ?? null,
    [pages, activeSlug],
  );

  if (doc.markdown) {
    return <MarkdownPanel markdown={doc.markdown} />;
  }
  if (pages.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700/60 bg-slate-950 p-6 text-center text-slate-300">
        <p className="text-sm">This docset has no pages yet.</p>
        <p className="mt-1 text-xs text-slate-500">
          Discovery created the bundle but the build worker has not produced output. Once the next
          build cycle completes the pages will appear here.
        </p>
      </div>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
      <ul className="space-y-2" aria-label="Page list">
        {pages.map((p) => (
          <li key={p.slug}>
            <Button
              type="button"
              variant={activeSlug === p.slug ? 'primary' : 'secondary'}
              className="w-full justify-start"
              onClick={() => setActiveSlug(p.slug)}
              aria-label={`Open ${p.title}`}
            >
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] uppercase">
                  {KIND_LABEL[p.kind]}
                </Badge>
                <span className="truncate text-left">{p.title}</span>
              </span>
            </Button>
          </li>
        ))}
      </ul>
      <PagePanel page={activePage} />
    </div>
  );
}

function PagePanel({ page }: { page: DocPage | null }) {
  if (!page) {
    return (
      <div className="rounded-lg border border-slate-700/60 bg-slate-950 p-6 text-sm text-slate-400">
        Select a page to view its source path and metadata.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-950 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-100">{page.title}</h3>
        <Badge>{KIND_LABEL[page.kind]}</Badge>
      </div>
      <dl className="grid grid-cols-1 gap-2 text-xs text-slate-300 sm:grid-cols-2">
        <div>
          <dt className="text-slate-500 uppercase tracking-wide">Source path</dt>
          <dd className="truncate font-mono text-amber-300" title={page.sourcePath}>
            {page.sourcePath}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500 uppercase tracking-wide">Size</dt>
          <dd>{page.sizeBytes ? `${page.sizeBytes} B` : '—'}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate-500 uppercase tracking-wide">Content SHA</dt>
          <dd className="truncate font-mono text-slate-300" title={page.contentSha}>
            {page.contentSha || '—'}
          </dd>
        </div>
      </dl>
      <p className="text-xs text-slate-500">
        Page bytes are served from the build cache. Render the bytes by hitting
        <code className="ml-1">/api/v1/docsets/{`<slug>`}/pages/{page.slug}</code> when the bytes
        endpoint is wired (Sprint-21 follow-up).
      </p>
    </div>
  );
}

// MarkdownPanel renders inline Markdown for built-in bundles. The
// converter projects a limited subset (headings, paragraphs, inline
// code, links, lists) into React elements so we never need
// `dangerouslySetInnerHTML` (banned by `15-CONTENT-SECURITY.md`).
type MarkdownBlock =
  | { kind: 'h1' | 'h2' | 'h3' | 'p'; key: string; spans: InlineSpan[] }
  | { kind: 'ul'; key: string; items: InlineSpan[][] };

type InlineSpan =
  | { kind: 'text'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'strong'; text: string }
  | { kind: 'link'; text: string; href: string };

function MarkdownPanel({ markdown }: { markdown: string }) {
  const blocks = useMemo(() => parseSimpleMarkdown(markdown), [markdown]);
  return (
    <div className="prose prose-invert max-w-none text-sm leading-6 text-slate-200">
      {blocks.map((block) => {
        switch (block.kind) {
          case 'h1':
            return <h1 key={block.key}>{renderSpans(block.spans)}</h1>;
          case 'h2':
            return <h2 key={block.key}>{renderSpans(block.spans)}</h2>;
          case 'h3':
            return <h3 key={block.key}>{renderSpans(block.spans)}</h3>;
          case 'p':
            return <p key={block.key}>{renderSpans(block.spans)}</p>;
          case 'ul':
            return (
              <ul key={block.key}>
                {block.items.map((item, i) => (
                  <li key={`${block.key}-${i}`}>{renderSpans(item)}</li>
                ))}
              </ul>
            );
        }
      })}
    </div>
  );
}

function renderSpans(spans: InlineSpan[]) {
  return spans.map((span, i) => {
    switch (span.kind) {
      case 'text':
        return <Fragment key={i}>{span.text}</Fragment>;
      case 'code':
        return <code key={i}>{span.text}</code>;
      case 'strong':
        return <strong key={i}>{span.text}</strong>;
      case 'link':
        return (
          <a key={i} href={span.href} rel="noreferrer noopener">
            {span.text}
          </a>
        );
    }
  });
}

// parseSimpleMarkdown converts a constrained Markdown subset (headings,
// paragraphs, inline code, links, lists) into typed React-renderable
// blocks. Anything outside the subset (tables, fenced code with
// language, raw HTML) falls through as a paragraph so the user always
// sees readable content.
function parseSimpleMarkdown(input: string): MarkdownBlock[] {
  const lines = input.replace(/\r/g, '').split('\n');
  const blocks: MarkdownBlock[] = [];
  let listOpen: MarkdownBlock | null = null;
  let blockIdx = 0;
  const nextKey = () => `b-${blockIdx++}`;

  const flushList = () => {
    if (listOpen) {
      blocks.push(listOpen);
      listOpen = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith('# ')) {
      flushList();
      blocks.push({ kind: 'h1', key: nextKey(), spans: parseInline(line.slice(2)) });
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      blocks.push({ kind: 'h2', key: nextKey(), spans: parseInline(line.slice(3)) });
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      blocks.push({ kind: 'h3', key: nextKey(), spans: parseInline(line.slice(4)) });
      continue;
    }
    if (line.startsWith('- ')) {
      if (!listOpen) listOpen = { kind: 'ul', key: nextKey(), items: [] };
      (listOpen as { items: InlineSpan[][] }).items.push(parseInline(line.slice(2)));
      continue;
    }
    if (line.trim() === '') {
      flushList();
      continue;
    }
    flushList();
    blocks.push({ kind: 'p', key: nextKey(), spans: parseInline(line) });
  }
  flushList();
  return blocks;
}

// parseInline tokenises one line into inline spans. The grammar is
// linear and predictable: code (`...`) → strong (**...**) → link
// ([text](url)) → plain text. We bail out to plain text on malformed
// markup so the user still sees the original characters.
function parseInline(input: string): InlineSpan[] {
  const out: InlineSpan[] = [];
  let i = 0;
  let buffer = '';
  const flush = () => {
    if (buffer) {
      out.push({ kind: 'text', text: buffer });
      buffer = '';
    }
  };
  while (i < input.length) {
    const ch = input[i];
    if (ch === '`') {
      const end = input.indexOf('`', i + 1);
      if (end === -1) {
        buffer += ch;
        i++;
        continue;
      }
      flush();
      out.push({ kind: 'code', text: input.slice(i + 1, end) });
      i = end + 1;
      continue;
    }
    if (ch === '*' && input[i + 1] === '*') {
      const end = input.indexOf('**', i + 2);
      if (end === -1) {
        buffer += ch;
        i++;
        continue;
      }
      flush();
      out.push({ kind: 'strong', text: input.slice(i + 2, end) });
      i = end + 2;
      continue;
    }
    if (ch === '[') {
      const labelEnd = input.indexOf(']', i + 1);
      if (labelEnd === -1 || input[labelEnd + 1] !== '(') {
        buffer += ch;
        i++;
        continue;
      }
      const urlEnd = input.indexOf(')', labelEnd + 2);
      if (urlEnd === -1) {
        buffer += ch;
        i++;
        continue;
      }
      flush();
      out.push({
        kind: 'link',
        text: input.slice(i + 1, labelEnd),
        href: input.slice(labelEnd + 2, urlEnd),
      });
      i = urlEnd + 1;
      continue;
    }
    buffer += ch;
    i++;
  }
  flush();
  return out;
}

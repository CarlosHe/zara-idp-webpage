import { useMemo, useState } from 'react';
import { BookOpen, FileText, AlertTriangle } from 'lucide-react';
import { PageHeader, ErrorState, LoadingState } from '@/shared/components/feedback';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/api';
import { useGetTechDocQuery, useListTechDocsQuery } from '../services/docsApi';
import type { DocFinding, TechDoc } from '../types';
import { OpenAPIViewer } from './OpenAPIViewer';
import { RichDocRenderer } from './RichDocRenderer';

export function DocsPage() {
  const { data: docs = [], isLoading, error, refetch } = useListTechDocsQuery();
  const [selectedSlug, setSelectedSlug] = useState<string>('catalog-v2');
  const activeSlug = useMemo(
    () => (docs.some((doc) => doc.slug === selectedSlug) ? selectedSlug : docs[0]?.slug ?? selectedSlug),
    [docs, selectedSlug],
  );
  const { data: activeDoc } = useGetTechDocQuery(activeSlug, { skip: docs.length === 0 });

  if (isLoading) return <LoadingState message="Loading docs..." />;
  if (error) return <ErrorState message={errorMessage(error) || 'Failed to load docs'} onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<BookOpen className="h-6 w-6" />}
        iconClassName="text-amber-400"
        title="Docs"
        description="Service-owned Markdown, ADRs, runbooks, diagrams, and OpenAPI bundles"
        onRefresh={refetch}
      />

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Bundles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {docs.length === 0 ? (
              <p className="text-sm text-slate-400">No docs configured. Discovery will populate this list.</p>
            ) : (
              docs.map((doc) => (
                <Button
                  key={doc.slug}
                  type="button"
                  className="w-full justify-start"
                  variant={doc.slug === activeSlug ? 'primary' : 'secondary'}
                  onClick={() => setSelectedSlug(doc.slug)}
                  aria-label={`Select ${doc.title}`}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" aria-hidden />
                    <span className="truncate text-left">{doc.title}</span>
                    {doc.findings && doc.findings.length > 0 ? (
                      <AlertTriangle className="h-3 w-3 text-amber-400 ml-auto" aria-label="has findings" />
                    ) : null}
                  </span>
                </Button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle>{activeDoc?.title ?? 'Select a document'}</CardTitle>
              <div className="flex items-center gap-2">
                {activeDoc ? <Badge>{activeDoc.format}</Badge> : null}
                {activeDoc?.owner ? <Badge variant="info">{activeDoc.owner}</Badge> : null}
                {activeDoc?.version ? <Badge variant="outline">v{activeDoc.version}</Badge> : null}
                {activeDoc?.buildState ? (
                  <Badge variant={activeDoc.buildState === 'ready' ? 'success' : 'danger'}>
                    {activeDoc.buildState}
                  </Badge>
                ) : null}
              </div>
            </div>
            {activeDoc?.findings && activeDoc.findings.length > 0 ? (
              <div className="mt-2 space-y-1">
                {activeDoc.findings.map((finding) => (
                  <FindingChip key={finding.kind} finding={finding} />
                ))}
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            {renderActive(activeDoc)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function renderActive(doc: TechDoc | undefined) {
  if (!doc) return <p className="text-sm text-slate-400">No document selected.</p>;
  if (doc.format === 'openapi') {
    return <OpenAPIViewer doc={doc} />;
  }
  return <RichDocRenderer doc={doc} />;
}

function FindingChip({ finding }: { finding: DocFinding }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs text-amber-200">
      <AlertTriangle className="h-3 w-3" aria-hidden />
      <strong className="uppercase">{finding.kind}</strong>
      <span>{finding.message}</span>
    </div>
  );
}

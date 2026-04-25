import { useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { PageHeader, ErrorState, LoadingState } from '@/shared/components/feedback';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/api';
import { useGetTechDocQuery, useListTechDocsQuery } from '../services/docsApi';

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
        description="Server-rendered Markdown and Redoc-ready OpenAPI documentation"
        onRefresh={refetch}
      />

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Bundles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {docs.map((doc) => (
              <Button
                key={doc.slug}
                type="button"
                className="w-full justify-start"
                variant={doc.slug === activeSlug ? 'primary' : 'secondary'}
                onClick={() => setSelectedSlug(doc.slug)}
              >
                {doc.title}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{activeDoc?.title ?? 'Select a document'}</CardTitle>
              {activeDoc ? <Badge>{activeDoc.format}</Badge> : null}
            </div>
          </CardHeader>
          <CardContent>
            {activeDoc?.format === 'openapi' ? (
              <div className="rounded-lg border border-slate-700/60 bg-slate-950 p-4">
                <p className="text-sm text-slate-300">OpenAPI contract is Redoc-ready at:</p>
                <code className="mt-2 block text-sm text-amber-300">{activeDoc.openApiPath}</code>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-200">
                {activeDoc?.markdown ?? 'No document selected.'}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

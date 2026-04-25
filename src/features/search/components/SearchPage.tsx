import { FormEvent, useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader } from '@/shared/components/feedback';
import { Badge, Button, Card, CardContent, Input } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/api';
import { useSearchMutation } from '../services/searchApi';
import type { SearchScope } from '../types';

const SCOPES: SearchScope[] = ['catalog', 'docs', 'audit'];

export function SearchPage() {
  const [text, setText] = useState('');
  const [scopes, setScopes] = useState<SearchScope[]>(['catalog', 'docs']);
  const [runSearch, searchState] = useSearchMutation();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch({ text, scopes, limit: 25 });
  }

  function toggleScope(scope: SearchScope) {
    setScopes((current) =>
      current.includes(scope)
        ? current.filter((candidate) => candidate !== scope)
        : [...current, scope],
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<Search className="h-6 w-6" />}
        iconClassName="text-emerald-400"
        title="Search"
        description="Typed search across catalog, TechDocs, and audit records with trace correlation"
      />

      <Card>
        <CardContent className="pt-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex gap-3">
              <Input
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Search services, docs, and audit entries"
                aria-label="Search query"
              />
              <Button type="submit" isLoading={searchState.isLoading} disabled={scopes.length === 0}>
                Search
              </Button>
            </div>
            <fieldset className="flex flex-wrap gap-2">
              <legend className="sr-only">Search scopes</legend>
              {SCOPES.map((scope) => (
                <Button
                  key={scope}
                  type="button"
                  size="sm"
                  variant={scopes.includes(scope) ? 'primary' : 'secondary'}
                  onClick={() => toggleScope(scope)}
                >
                  {scope}
                </Button>
              ))}
            </fieldset>
          </form>
        </CardContent>
      </Card>

      {searchState.error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-red-300">
            {errorMessage(searchState.error) || 'Search failed'}
          </CardContent>
        </Card>
      ) : null}

      {searchState.data ? (
        <section aria-label="Search results" className="space-y-3">
          <p className="text-sm text-slate-400">
            {searchState.data.total} result(s) in {searchState.data.latencyMs}ms · trace{' '}
            <span className="font-mono text-slate-300">{searchState.data.traceId || 'local'}</span>
          </p>
          {searchState.data.items.map((result) => (
            <Card key={`${result.scope}-${result.entityKey}`}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-white">{result.title}</h2>
                    <p className="mt-1 text-sm text-slate-400">{result.entityKey}</p>
                  </div>
                  <Badge>{result.scope}</Badge>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-slate-300">{result.body}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}
    </div>
  );
}

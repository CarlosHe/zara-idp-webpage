import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

import { AUTH_TOKEN_KEY } from '@/shared/lib/api';
import { Button, Textarea, Card, CardContent, CardDescription, CardHeader, CardTitle, Alert } from '@/shared/components/ui';

function safeRedirect(value: string | null): string {
  if (!value) return '/';
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = useMemo(() => safeRedirect(searchParams.get('redirect')), [searchParams]);
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextToken = token.trim();
    if (!nextToken) {
      setError('Informe um access token válido.');
      return;
    }
    window.localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
    navigate(redirect, { replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.22),_transparent_32rem)] px-4 py-10">
      <Card variant="elevated" padding="lg" className="w-full max-w-lg border-slate-700/80 shadow-2xl shadow-blue-950/20">
        <CardHeader className="items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-300 ring-1 ring-blue-500/30">
            <ShieldCheck className="h-7 w-7" aria-hidden />
          </div>
          <CardTitle className="text-2xl">Entrar no Zara IDP</CardTitle>
          <CardDescription>
            Cole um access token emitido pelo ambiente local para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Textarea
              label="Access token"
              value={token}
              onChange={(event) => {
                setToken(event.target.value);
                setError(undefined);
              }}
              error={error}
              placeholder="eyJhbGciOi..."
              rows={5}
              autoFocus
            />
            <Alert type="info" title="Sessão local">
              O token fica salvo em localStorage apenas para o fluxo Bearer atual. Depois do login, você será enviado para {redirect}.
            </Alert>
            <Button type="submit" className="w-full" size="lg">
              Continuar
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

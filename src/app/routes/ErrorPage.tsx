import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export function ErrorPage() {
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;
  const message = is404
    ? 'The page you are looking for does not exist.'
    : 'Something went wrong while loading this page.';
  const heading = is404 ? 'Page Not Found' : 'Unexpected Error';

  return (
    <main
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-slate-100"
    >
      <AlertTriangle className="h-10 w-10 text-amber-400" aria-hidden />
      <h1 className="text-2xl font-semibold">{heading}</h1>
      <p className="text-slate-400">{message}</p>
      <div className="mt-2 flex gap-3">
        <Link
          to="/"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go home
        </Link>
        {!is404 ? (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
          >
            Try again
          </button>
        ) : null}
      </div>
    </main>
  );
}

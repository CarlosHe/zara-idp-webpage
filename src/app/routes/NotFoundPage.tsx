import { Link } from 'react-router-dom';

// NotFoundPage renders inside the dashboard shell when the user hits
// an unknown path that is still below `/`. For top-level 404s, see
// ErrorPage (wired via errorElement).
export function NotFoundPage() {
  return (
    <main className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <h1 className="text-3xl font-semibold text-slate-100">404</h1>
      <p className="text-slate-400">This page does not exist.</p>
      <Link to="/" className="text-sm text-blue-400 hover:text-blue-300">
        Go back to the dashboard
      </Link>
    </main>
  );
}

import { Link } from 'react-router-dom';

// NotFoundPage renders inside the dashboard shell when the user hits
// an unknown path that is still below `/`. For top-level 404s, see
// ErrorPage (wired via errorElement).
export function NotFoundPage() {
  return (
    <section
      role="alert"
      aria-labelledby="not-found-title"
      className="flex flex-col items-center justify-center gap-3 py-16 text-center"
    >
      <h1 id="not-found-title" className="text-3xl font-semibold text-slate-100">
        404
      </h1>
      <p className="text-slate-300">This page does not exist.</p>
      <Link
        to="/"
        className="text-sm text-blue-300 hover:text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
      >
        Go back to the dashboard
      </Link>
    </section>
  );
}

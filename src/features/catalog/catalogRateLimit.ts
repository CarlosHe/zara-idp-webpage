// Retry only an explicit rejection by the rate limiter. Network failures and
// 5xx writes remain errors because their commit status can be ambiguous.
export async function catalogRateLimit<T extends { error?: { status?: string | number; data?: unknown }; meta?: { response?: Response } }>(send: () => Promise<T>, signal: AbortSignal): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const response = await send();
    if (response.error?.status !== 429 || attempt >= 5 || signal.aborted) return response;
    const data = response.error.data as { retry_after?: number } | undefined;
    const seconds = Number(response.meta?.response?.headers.get('Retry-After') ?? data?.retry_after ?? 1);
    const delay = Number.isFinite(seconds) ? Math.max(0.1, Math.min(seconds, 30)) * 1000 : 1000;
    await new Promise<void>((resolve) => {
      const finish = () => { clearTimeout(timer); signal.removeEventListener('abort', finish); resolve(); };
      const timer = setTimeout(finish, delay);
      signal.addEventListener('abort', finish, { once: true });
    });
  }
}

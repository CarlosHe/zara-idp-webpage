// Local simulation uses a separate fetch client. Never attach the IDP token,
// real AWS credentials, production endpoints, or follow HTTP redirects.
export function localEndpoint(value: string): string {
  // Vite's fixed-target proxy is available only on local dev/preview servers.
  // It keeps the production CSP strict and avoids cross-origin browser access.
  if (value === '/local-aws') return value;
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['127.0.0.1', '[::1]'].includes(url.hostname) || !url.port
    || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('Use an HTTP loopback address with an explicit port, for example http://127.0.0.1:18081.');
  }
  return url.origin;
}

export function assertLocalQueueUrl(value: string) {
  const url = new URL(value);
  localEndpoint(url.origin);
  if (url.username || url.password || url.search || url.hash) throw new Error('Simulator returned an unsafe queue URL');
}

function localAuthentication(service: 'sqs' | 'events' | 's3') {
  const date = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  return {
    'X-Amz-Date': date,
    Authorization: `AWS4-HMAC-SHA256 Credential=local/${date.slice(0, 8)}/us-east-1/${service}/aws4_request, SignedHeaders=host;x-amz-date, Signature=${'0'.repeat(64)}`,
  };
}

export async function localAws(endpoint: string, service: 'sqs' | 'events', action: string, body: Record<string, unknown>) {
  const prefix = service === 'sqs' ? 'AmazonSQS' : 'AWSEvents';
  const response = await fetch(localEndpoint(endpoint), {
    method: 'POST', credentials: 'omit', redirect: 'error',
    // Moto uses the credential scope to route localhost requests to the AWS
    // service. These fixed fake credentials are ONLY for the local simulator;
    // it does not verify the signature. An unsigned POST can route to S3 and
    // return HTTP 200 XML without creating a queue or event bus.
    headers: {
      'Content-Type': service === 'events' ? 'application/x-amz-json-1.1' : 'application/x-amz-json-1.0',
      'X-Amz-Target': `${prefix}.${action}`, ...localAuthentication(service),
    },
    body: JSON.stringify(body), signal: AbortSignal.timeout(15_000),
  });
  let data: Record<string, unknown>;
  try {
    // Moto can return a JSON body with text/html Content-Type. Validate the
    // actual payload so XML HTTP 200 responses still fail explicitly.
    const parsed: unknown = JSON.parse(await response.text());
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('expected JSON object');
    data = parsed as Record<string, unknown>;
  } catch { throw new Error(`${action}: simulator returned a non-JSON response; check its AWS service routing`); }
  if (!response.ok || data.__type || Number(data.FailedEntryCount ?? 0) > 0) throw new Error(`${action}: ${String(data.message ?? data.Message ?? JSON.stringify(data))}`);
  return data;
}

export async function localObject(endpoint: string, bucket: string, key = '', method = 'GET', body?: string) {
  const response = await fetch(`${localEndpoint(endpoint)}/${encodeURIComponent(bucket)}${key ? '/' + encodeURIComponent(key) : ''}`, {
    method, body, headers: localAuthentication('s3'), credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const text = await response.text();
    if (method === 'PUT' && text.includes('BucketAlreadyOwnedByYou')) return '';
    throw new Error(`S3 ${method}: ${response.status} ${text.slice(0, 200)}`);
  }
  return response.text();
}

export function localQueueArn(region: string, name: string) {
  return `arn:aws:sqs:${region}:123456789012:${name}`;
}

export async function ensureLocalEventBus(endpoint: string, name: string) {
  const result = await localAws(endpoint, 'events', 'ListEventBuses', {});
  if (!((result.EventBuses ?? []) as { Name: string }[]).some((bus) => bus.Name === name)) {
    await localAws(endpoint, 'events', 'CreateEventBus', { Name: name });
  }
}

export function queueNameFromArn(arn: string): string {
  const parsed = /^arn:aws(?:-[a-z]+)?:sqs:[a-z0-9-]+:\d{12}:([a-zA-Z0-9_-]+(?:\.fifo)?)$/.exec(arn);
  if (!parsed || parsed[1].length > 80) throw new Error('Dead-letter reference is not a valid SQS queue ARN');
  return parsed[1];
}

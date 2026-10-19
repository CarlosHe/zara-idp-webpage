import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { PageHeader } from '@/shared/components/feedback';
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/shared/components/ui';
import { parseCatalogImport } from '@/features/catalog/catalogImport';
import type { CatalogRegistration } from '@/features/catalog/types';
import { assertLocalQueueUrl, ensureLocalEventBus, localAws, localEndpoint, localObject, localQueueArn, queueNameFromArn } from './localAws';

type Metadata = Record<string, unknown>;
function cloudData(entity: CatalogRegistration): { region: string; metadata: Metadata } | undefined {
  const cloud = entity.spec.cloud;
  if (!cloud || typeof cloud !== 'object' || !('metadata' in cloud)) return;
  return cloud as { region: string; metadata: Metadata };
}

export function DevelopmentPage() {
  const [endpoint, setEndpoint] = useState('/local-aws');
  const [inventory, setInventory] = useState<CatalogRegistration[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [failures, setFailures] = useState<string[]>([]);
  const resources = (type: string) => inventory.filter((entry) => entry.spec.type === type && cloudData(entry));

  async function simulate() {
    setBusy(true); setError(''); setResults([]); setFailures([]);
    const failed: string[] = [];
    const counts = { queues: 0, buckets: 0, buses: 0, rules: 0, targets: 0, skippedTargets: 0, inferredDlqs: 0 };
    const queues = new Map<string, { url: string; arn: string }>();
    async function attempt(label: string, work: () => Promise<void>) {
      setProgress(label);
      try { await work(); } catch (err) { failed.push(`${label}: ${(err as Error).message}`); }
    }
    try {
      localEndpoint(endpoint);
      for (const entry of resources('aws-sqs')) {
        const { region, metadata } = cloudData(entry)!;
        const name = String(metadata.name);
        await attempt(`Queue ${name}`, async () => {
          const attributes: Record<string, string> = {};
          for (const attr of ['VisibilityTimeout', 'MessageRetentionPeriod', 'FifoQueue', 'ContentBasedDeduplication']) {
            if (metadata[attr] !== null && metadata[attr] !== undefined) attributes[attr] = String(metadata[attr]);
          }
          const created = await localAws(endpoint, 'sqs', 'CreateQueue', { QueueName: name, Attributes: attributes });
          const url = String(created.QueueUrl);
          assertLocalQueueUrl(url);
          queues.set(String(metadata.QueueArn ?? `arn:aws:sqs:${region}:unknown:${name}`), { url, arn: localQueueArn('us-east-1', name) });
          counts.queues++;
        });
      }
      for (const entry of resources('aws-sqs')) {
        const metadata = cloudData(entry)!.metadata;
        if (!metadata.RedrivePolicy || !metadata.QueueArn) continue;
        await attempt(`Dead-letter routing ${String(metadata.name)}`, async () => {
          const policy = JSON.parse(String(metadata.RedrivePolicy)) as { deadLetterTargetArn: string; maxReceiveCount: number };
          const queue = queues.get(String(metadata.QueueArn));
          let target = queues.get(policy.deadLetterTargetArn);
          if (!target) {
            const name = queueNameFromArn(policy.deadLetterTargetArn);
            const created = await localAws(endpoint, 'sqs', 'CreateQueue', { QueueName: name, Attributes: name.endsWith('.fifo') ? { FifoQueue: 'true' } : {} });
            const url = String(created.QueueUrl); assertLocalQueueUrl(url);
            target = { url, arn: localQueueArn('us-east-1', name) };
            queues.set(policy.deadLetterTargetArn, target);
            counts.inferredDlqs++;
          }
          if (!queue) throw new Error('Source queue was not created locally');
          await localAws(endpoint, 'sqs', 'SetQueueAttributes', { QueueUrl: queue.url, Attributes: { RedrivePolicy: JSON.stringify({ ...policy, deadLetterTargetArn: target.arn }) } });
        });
      }
      for (const entry of resources('aws-s3')) {
        const name = String(cloudData(entry)!.metadata.name);
        await attempt(`Bucket ${name}`, async () => { await localObject(endpoint, name, '', 'PUT'); counts.buckets++; });
      }
      for (const entry of resources('aws-eventbridge')) {
        const name = String(cloudData(entry)!.metadata.name);
        await attempt(`Event bus ${name}`, async () => {
          await ensureLocalEventBus(endpoint, name);
          counts.buses++;
        });
      }
      for (const entry of inventory.filter((e) => String(e.spec.type).startsWith('aws-event-rules-'))) {
        const { metadata } = cloudData(entry)!;
        const bus = String(entry.spec.type).slice('aws-event-rules-'.length);
        await attempt(`Rule ${bus}/${String(metadata.name)}`, async () => {
          await localAws(endpoint, 'events', 'PutRule', {
            Name: metadata.name, EventBusName: bus, State: metadata.state,
            ...(metadata.eventPattern ? { EventPattern: metadata.eventPattern } : {}),
            ...(metadata.schedule ? { ScheduleExpression: metadata.schedule } : {}),
          });
          counts.rules++;
          const targets = (metadata.targets ?? []) as { id: string; arn: string }[];
          const localTargets = targets.flatMap((target) => {
            const queue = queues.get(target.arn);
            if (!queue) { counts.skippedTargets++; return []; }
            return [{ Id: target.id, Arn: queue.arn, ...(queue.arn.endsWith('.fifo') ? { SqsParameters: { MessageGroupId: 'local-development' } } : {}) }];
          });
          if (localTargets.length) {
            await localAws(endpoint, 'events', 'PutTargets', { Rule: metadata.name, EventBusName: bus, Targets: localTargets });
            counts.targets += localTargets.length;
          }
        });
      }
      setResults([`${counts.queues} queues, ${counts.buckets} buckets, ${counts.buses} buses, ${counts.rules} rules, ${counts.targets} SQS targets configured locally.`,
        `${counts.skippedTargets} targets without a local SQS mapping were skipped. Schedules are registered but are not executed by this simulator.`,
        `${counts.inferredDlqs} additional local DLQs configured from unresolved redrive references. Their settings use simulator defaults; they were not observed in the AWS inventory.`]);
      setFailures(failed);
      setProgress(failed.length ? 'Local simulation completed with failures' : 'Local simulation ready');
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  async function verify() {
    setBusy(true); setError(''); setResults([]); setFailures([]); setProgress('Testing local data flows');
    try {
      const marker = `local-check-${Date.now()}`;
      const bus = 'zara-local-check';
      const queue = await localAws(endpoint, 'sqs', 'CreateQueue', { QueueName: 'zara-local-check' });
      const queueUrl = String(queue.QueueUrl);
      assertLocalQueueUrl(queueUrl);
      await ensureLocalEventBus(endpoint, bus);
      await localAws(endpoint, 'events', 'PutRule', { Name: 'probe', EventBusName: bus, EventPattern: JSON.stringify({ source: ['zara.local-check'] }) });
      await localAws(endpoint, 'events', 'PutTargets', { Rule: 'probe', EventBusName: bus, Targets: [{ Id: 'queue', Arn: localQueueArn('us-east-1', 'zara-local-check') }] });
      await localAws(endpoint, 'events', 'PutEvents', { Entries: [{ EventBusName: bus, Source: 'zara.local-check', DetailType: 'LocalCheck', Detail: JSON.stringify({ marker }) }] });
      const received = await localAws(endpoint, 'sqs', 'ReceiveMessage', { QueueUrl: queueUrl, MaxNumberOfMessages: 10, WaitTimeSeconds: 1 });
      const message = ((received.Messages ?? []) as { Body: string; ReceiptHandle: string }[]).find((m) => m.Body.includes(marker));
      if (!message) throw new Error('EventBridge event did not arrive in SQS');
      await localAws(endpoint, 'sqs', 'DeleteMessage', { QueueUrl: queueUrl, ReceiptHandle: message.ReceiptHandle });
      setResults(['PASS: EventBridge event delivered to SQS and acknowledged.']);
      await localObject(endpoint, 'zara-local-check', '', 'PUT');
      await localObject(endpoint, 'zara-local-check', 'probe.json', 'PUT', JSON.stringify({ marker }));
      const saved = JSON.parse(await localObject(endpoint, 'zara-local-check', 'probe.json')) as { marker: string };
      if (saved.marker !== marker) throw new Error('S3 object content differs');
      setResults((previous) => [...previous, 'PASS: S3 object written and read with matching content.']);
      setProgress('Local data flows verified');
    } catch (err) { setError((err as Error).message); setProgress('Local verification failed'); }
    finally { setBusy(false); }
  }

  return <div className="space-y-6">
    <PageHeader title="Local development" icon={<FlaskConical className="h-6 w-6" />} description="Run a local AWS API simulation from an inventory snapshot" />
    <Alert type="info">Requires a Moto server forwarded to 127.0.0.1:18081. The /local-aws proxy is provided by the local development and preview servers. Requests use fixed dummy credentials, without your Zara token or AWS credentials. ECS, RDS, IAM, ALB, CloudFront and DNS records remain catalog metadata; this simulator does not run those production services.</Alert>
    <Card><CardHeader><CardTitle>Local simulator</CardTitle></CardHeader><CardContent className="space-y-4">
      <Input label="Local AWS endpoint" value={endpoint} disabled={busy} onChange={(event) => setEndpoint(event.target.value)} />
      <Input label="Local simulation inventory" type="file" accept=".json,application/json" disabled={busy} onChange={async (event) => {
        setError(''); setInventory([]);
        const file = event.target.files?.[0];
        if (!file) return;
        try {
          if (file.size > 10 * 1024 * 1024) throw new Error('Inventory must be smaller than 10 MB.');
          setInventory(parseCatalogImport(await file.text()));
        } catch (err) { setError((err as Error).message); }
      }} />
      <p>{inventory.length} catalog entries loaded; {resources('aws-sqs').length} queues, {resources('aws-s3').length} buckets, {resources('aws-eventbridge').length} event buses available for simulation.</p>
      <div className="flex gap-3"><Button disabled={busy || !inventory.length} onClick={() => void simulate()}>Initialize local simulation</Button>
        <Button disabled={busy} variant="secondary" onClick={() => void verify()}>Test event and object flows</Button></div>
      <p role="status" aria-label="Local simulation progress">{progress}</p>
      {error && <Alert type="error">{error}</Alert>}
      <ul aria-label="Local simulation results">{results.map((result) => <li key={result}>{result}</li>)}</ul>
      {failures.length > 0 && <Alert type="error"><p>{failures.length} simulation failures</p><ul>{failures.map((failure, index) => <li key={index}>{failure}</li>)}</ul></Alert>}
      <p className="text-sm text-slate-400">Moto models AWS APIs in memory. Restarting the pod resets the simulation. API success does not validate AWS IAM permissions, durability, autoscaling, CDN behavior or application migrations.</p>
    </CardContent></Card>
  </div>;
}

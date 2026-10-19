import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Modal } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/api';
import { architectureExample } from '../types/architectureExample';
import { workloadExample } from '../types/workloadExample';
import { useApplyYamlMutation, type ApplyYamlResponse } from '../services/resourcesApi';

export default function ManifestApplyModal({ onClose }: { onClose: () => void }) {
  const [yaml, setYaml] = useState('');
  const [exampleNamespace, setExampleNamespace] = useState('default');
  const [validated, setValidated] = useState('');
  const [plan, setPlan] = useState<ApplyYamlResponse | null>(null);
  const [result, setResult] = useState<ApplyYamlResponse | null>(null);
  const [failure, setFailure] = useState('');
  const [apply, state] = useApplyYamlMutation();
  async function submit(dryRun: boolean) {
    setFailure('');
    try {
      const response = await apply({ yaml, dry_run: dryRun }).unwrap();
      if (response.summary.failed) {
        const details = response.results.filter((resource) => resource.error).map((resource) => `${resource.kind}/${resource.namespace}/${resource.name}: ${resource.error}`).join('\n');
        throw new Error(details || 'Some resources could not be queued. Review the ChangeSet before retrying.');
      }
      if (dryRun) { setPlan(response); setValidated(yaml); } else { setResult(response); }
    } catch (error) {
      setFailure(errorMessage(error as Parameters<typeof errorMessage>[0]) || 'Unable to submit manifests');
    }
  }
  return <Modal isOpen onClose={onClose} title="Apply resource manifests" size="xl">
    <div className="space-y-4">
      <p className="text-sm text-slate-300">Paste YAML or JSON resources, separated by --- for a complete architecture. Validate the plan before requesting provisioning. Create the target namespace first.</p>
      {!result && <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-slate-300">Example namespace
          <input aria-label="Example namespace" value={exampleNamespace} onChange={(event) => setExampleNamespace(event.target.value)} className="mt-1 block rounded border border-slate-600 bg-slate-950 p-2" />
        </label>
        <Button variant="secondary" disabled={state.isLoading || !exampleNamespace.trim()} onClick={() => {
          setYaml(JSON.stringify(workloadExample(exampleNamespace.trim()), null, 2)); setValidated(''); setPlan(null); setFailure('');
        }}>Load Kubernetes workload example</Button>
        <Button variant="secondary" onClick={() => { setYaml(architectureExample(exampleNamespace).map((resource) => JSON.stringify(resource, null, 2)).join('\n---\n')); setValidated(''); setPlan(null); setFailure(''); }}>Load persistent architecture example</Button>
        <p className="w-full text-xs text-slate-400">The example runs two HTTP ports, three probes and an init container with shared storage. It reads the cluster CA ConfigMap. The namespace must already exist.</p>
      </div>}
      <label className="block text-sm text-slate-300">Load manifest file
        <input type="file" accept=".yaml,.yml,.json" className="mt-1 block" disabled={!!result} onChange={async (event) => {
          const file = event.target.files?.[0]; if (file) { setYaml(await file.text()); setValidated(''); setPlan(null); }
        }} />
      </label>
      <label htmlFor="manifest-yaml" className="block text-sm text-slate-200">Manifest YAML</label>
      <textarea id="manifest-yaml" rows={14} className="w-full rounded border border-slate-600 bg-slate-950 p-3 font-mono text-sm text-slate-100" value={yaml} disabled={!!result} onChange={(event) => {
        setYaml(event.target.value); setValidated(''); setPlan(null); setFailure('');
      }} />
      {failure && <Alert type="error" title="Manifest request failed">{failure}</Alert>}
      {plan && <div className="space-y-2 text-sm">
        <p>{plan.approval_required ? 'Approval will be required before execution.' : 'This plan can be queued without approval.'}</p>
        <ul>{plan.results.map((resource, index) => <li key={index} className="font-mono">{resource.kind}/{resource.namespace}/{resource.name} · {resource.action}</li>)}</ul>
        <p className="text-slate-400">Dry run: no resources or jobs have been created.</p>
      </div>}
      {result && <Alert type="success" title={result.approval_required ? 'Awaiting approval' : 'Provisioning requested'}>
        <p>{result.approval_required ? 'The infrastructure will be changed after approval.' : 'Workers will execute the request. Check each job before considering the architecture ready.'}</p>
        {result.changeset_id && <Link className="mt-2 inline-block underline" to={`/changesets/${result.changeset_id}`} onClick={onClose}>Open ChangeSet</Link>}
      </Alert>}
      {!result && <div className="flex gap-3">
        <Button variant="secondary" disabled={!yaml.trim() || state.isLoading} onClick={() => void submit(true)}>Validate plan</Button>
        <Button disabled={!validated || validated !== yaml || state.isLoading} loading={state.isLoading} onClick={() => void submit(false)}>Request provisioning</Button>
      </div>}
    </div>
  </Modal>;
}

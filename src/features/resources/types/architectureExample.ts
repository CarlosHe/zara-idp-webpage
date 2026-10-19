// Finite migration writes shared persistent storage. The application is gated
// on successful migration, then serves the resulting artifact over HTTP.
export function architectureExample(namespace = 'default') {
  const resource = (kind: string, name: string, spec: Record<string, unknown>) => ({ apiVersion: 'zara.internal/v1', kind, metadata: { name, namespace }, spec: { name, namespace, ...spec } });
  const volume = { name: 'data', claim: 'architecture-data' };
  const mount = { name: 'data', mount_path: '/data' };
  const config = { kind: 'ConfigMap', name: 'architecture-settings' };
  return [
    resource('Secret', 'architecture-credentials', { generate_keys: ['API_KEY'], immutable: true }),
    resource('ConfigMap', 'architecture-settings', { data: { MESSAGE: 'Zara persistent architecture ready' } }),
    resource('Volume', 'architecture-data', { size: '64Mi', access_modes: ['ReadWriteOnce'], reclaim_policy: 'Delete' }),
    resource('Job', 'architecture-migrate', {
      image: 'nginx:alpine', command: ['sh', '-c', 'test ${#API_KEY} -ge 40 && printf "%s\\n" "$MESSAGE" > /data/index.html && echo "Zara migration completed"'], env_from: [config], env_refs: { API_KEY: { kind: 'Secret', name: 'architecture-credentials', key: 'API_KEY' } },
      volumes: [volume], volume_mounts: [mount], cpu: '25m', memory: '32Mi', active_deadline_seconds: 90, backoff_limit: 0,
      dependsOn: [config, { kind: 'Secret', name: 'architecture-credentials' }, { kind: 'Volume', name: 'architecture-data' }],
    }),
    resource('Application', 'architecture-web', {
      image: 'nginx:alpine', replicas: 1, platform: 'kubernetes', port: 8080, cpu: '25m', memory: '32Mi',
      command: ['sh', '-c'], args: ['printf \'events {} http { server { listen 8080; root /data; } }\' > /tmp/nginx.conf; exec nginx -c /tmp/nginx.conf -g "daemon off;"'],
      volumes: [volume], volume_mounts: [{ ...mount, read_only: true }], readiness_probe: { http_path: '/', port: 8080 },
      dependsOn: [{ kind: 'Job', name: 'architecture-migrate' }],
    }),
    resource('NetworkPolicy', 'architecture-ingress', {
      podSelector: { matchLabels: { app: 'architecture-web' } }, policyTypes: ['Ingress'],
      ingress: [{ from: [{ podSelector: { matchLabels: { app: 'architecture-client' } } }], ports: [{ protocol: 'TCP', port: 8080 }] }],
      dependsOn: [{ kind: 'Application', name: 'architecture-web' }],
    }),
    resource('CronJob', 'architecture-refresh', {
      image: 'nginx:alpine', command: ['sh', '-c', 'date -u > /data/last-refresh.txt'], volumes: [volume], volume_mounts: [mount],
      schedule: '* * * * *', concurrency_policy: 'Forbid', active_deadline_seconds: 60, backoff_limit: 0, cpu: '25m', memory: '32Mi',
      dependsOn: [{ kind: 'Job', name: 'architecture-migrate' }],
    }),
  ];
}

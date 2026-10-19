/** A runnable example for the local Kubernetes provider, also accepted by zaractl. */
export function workloadExample(namespace = 'default', name = 'workload-example') {
  return {
    apiVersion: 'zara.internal/v1', kind: 'Application',
    metadata: { name, namespace },
    spec: {
      name, namespace, platform: 'kubernetes', image: 'nginx:alpine', replicas: 1,
      cpu: '25m', memory: '32Mi',
      ports: [{ name: 'http', port: 8080, service_port: 8088 }, { name: 'admin', port: 8081 }],
      command: ['nginx'], args: ['-c', '/work/nginx.conf', '-g', 'daemon off;'],
      env_refs: { CLUSTER_CA: { kind: 'ConfigMap', name: 'kube-root-ca.crt', key: 'ca.crt' } },
      volumes: [{ name: 'work', empty_dir: true }, { name: 'cluster-ca', config_map: 'kube-root-ca.crt' }],
      volume_mounts: [{ name: 'work', mount_path: '/work' }, { name: 'cluster-ca', mount_path: '/cluster-ca', read_only: true }],
      init_containers: [{ name: 'prepare', image: 'nginx:alpine',
        command: ['sh', '-ec'], args: ["cat > /work/nginx.conf <<'CONFIG'\nevents {}\nhttp {\n server { listen 8080; location / { default_type text/plain; return 200 'Zara workload ready\\n'; } }\n server { listen 8081; location / { default_type text/plain; return 200 'Zara admin ready\\n'; } }\n}\nCONFIG\ntest -s /cluster-ca/ca.crt\n"],
        volume_mounts: [{ name: 'work', mount_path: '/work' }, { name: 'cluster-ca', mount_path: '/cluster-ca', read_only: true }],
      }],
      readiness_probe: { http_path: '/', port: 8080, period_seconds: 2 },
      liveness_probe: { tcp: true, port: 8081, period_seconds: 5 },
      startup_probe: { command: ['test', '-s', '/work/nginx.conf'], period_seconds: 2, failure_threshold: 15 },
    },
  };
}

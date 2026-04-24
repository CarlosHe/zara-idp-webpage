import { useState } from 'react';
import {
  Sparkles,
  Database,
  Server,
  Globe,
  Key,
  FileCode,
  ArrowRight,
  Check,
  Copy,
  Terminal,
  Workflow,
  Eye,
  Zap,
  Building2,
  Box,
  GitBranch,
  MessageSquare,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Select,
  Alert,
} from '@/shared/components/ui';
import { PageHeader } from '@/shared/components/feedback';
import { api } from '@/shared/lib/api';

interface GoldenPath {
  id: string;
  name: string;
  description: string;
  icon: typeof Database;
  category: 'database' | 'application' | 'infrastructure' | 'observability' | 'cicd' | 'organization';
  parameters: PathParameter[];
  template: string;
}

interface PathParameter {
  name: string;
  label: string;
  type: 'text' | 'select';
  options?: { value: string; label: string }[];
  required: boolean;
  default?: string;
  placeholder?: string;
}

const goldenPaths: GoldenPath[] = [
  {
    id: 'postgres-database',
    name: 'PostgreSQL Database',
    description: 'Create a new PostgreSQL database with owner role and app role',
    icon: Database,
    category: 'database',
    parameters: [
      { name: 'name', label: 'Database Name', type: 'text', required: true, placeholder: 'orders-db' },
      { name: 'namespace', label: 'Namespace', type: 'text', required: true, placeholder: 'production' },
      { name: 'owner', label: 'Owner Team', type: 'text', required: true, placeholder: 'platform-team' },
      {
        name: 'size',
        label: 'Size',
        type: 'select',
        required: true,
        options: [
          { value: 'small', label: 'Small (10GB)' },
          { value: 'medium', label: 'Medium (50GB)' },
          { value: 'large', label: 'Large (200GB)' },
        ],
      },
    ],
    template: `apiVersion: zara.io/v1
kind: PostgresDatabase
metadata:
  name: {{name}}
  namespace: {{namespace}}
spec:
  owner: {{owner}}
  size: {{size}}
  extensions:
    - uuid-ossp
    - pgcrypto
  backup:
    enabled: true
    retention: 7d
---
apiVersion: zara.io/v1
kind: PostgresRole
metadata:
  name: {{name}}-owner
  namespace: {{namespace}}
spec:
  databaseRef: {{name}}
  privileges:
    - ALL
---
apiVersion: zara.io/v1
kind: PostgresRole
metadata:
  name: {{name}}-app
  namespace: {{namespace}}
spec:
  databaseRef: {{name}}
  privileges:
    - SELECT
    - INSERT
    - UPDATE
    - DELETE`,
  },
  {
    id: 'microservice',
    name: 'Microservice Application',
    description: 'Create a complete microservice with database, secrets, and deployment config',
    icon: Server,
    category: 'application',
    parameters: [
      { name: 'name', label: 'Service Name', type: 'text', required: true, placeholder: 'orders-api' },
      { name: 'namespace', label: 'Namespace', type: 'text', required: true, placeholder: 'production' },
      { name: 'image', label: 'Docker Image', type: 'text', required: true, placeholder: 'myapp/orders-api' },
      { name: 'port', label: 'Container Port', type: 'text', required: true, default: '8080' },
      { name: 'owner', label: 'Owner Team', type: 'text', required: true, placeholder: 'backend-team' },
    ],
    template: `apiVersion: zara.io/v1
kind: Application
metadata:
  name: {{name}}
  namespace: {{namespace}}
  labels:
    team: {{owner}}
spec:
  image: {{image}}
  tag: latest
  ports:
    - containerPort: {{port}}
  resources:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi
  healthCheck:
    httpGet:
      path: /health
      port: {{port}}
---
apiVersion: zara.io/v1
kind: Secret
metadata:
  name: {{name}}-db-credentials
  namespace: {{namespace}}
spec:
  type: database-credentials
  databaseRef: {{name}}-db
  roleRef: {{name}}-db-app`,
  },
  {
    id: 'api-gateway',
    name: 'API Gateway / Ingress',
    description: 'Expose a service with ingress routing and TLS',
    icon: Globe,
    category: 'infrastructure',
    parameters: [
      { name: 'name', label: 'Ingress Name', type: 'text', required: true, placeholder: 'api-gateway' },
      { name: 'namespace', label: 'Namespace', type: 'text', required: true, placeholder: 'production' },
      { name: 'host', label: 'Hostname', type: 'text', required: true, placeholder: 'api.example.com' },
      { name: 'serviceName', label: 'Backend Service', type: 'text', required: true, placeholder: 'orders-api' },
      { name: 'servicePort', label: 'Service Port', type: 'text', required: true, default: '8080' },
    ],
    template: `apiVersion: zara.io/v1
kind: Ingress
metadata:
  name: {{name}}
  namespace: {{namespace}}
spec:
  host: {{host}}
  tls:
    enabled: true
    secretName: {{name}}-tls
  rules:
    - path: /
      backend:
        serviceName: {{serviceName}}
        servicePort: {{servicePort}}`,
  },
  {
    id: 'database-credentials',
    name: 'Database Credentials Secret',
    description: 'Create secure credentials for database access',
    icon: Key,
    category: 'infrastructure',
    parameters: [
      { name: 'name', label: 'Secret Name', type: 'text', required: true, placeholder: 'orders-db-credentials' },
      { name: 'namespace', label: 'Namespace', type: 'text', required: true, placeholder: 'production' },
      { name: 'databaseRef', label: 'Database Reference', type: 'text', required: true, placeholder: 'orders-db' },
      { name: 'roleRef', label: 'Role Reference', type: 'text', required: true, placeholder: 'orders-db-app' },
    ],
    template: `apiVersion: zara.io/v1
kind: Secret
metadata:
  name: {{name}}
  namespace: {{namespace}}
spec:
  type: database-credentials
  databaseRef: {{databaseRef}}
  roleRef: {{roleRef}}`,
  },
  {
    id: 'namespace-complete',
    name: 'Complete Namespace',
    description: 'Create a namespace with team ownership, quotas, and default policies',
    icon: Box,
    category: 'organization',
    parameters: [
      { name: 'name', label: 'Namespace Name', type: 'text', required: true, placeholder: 'ecommerce-prod' },
      { name: 'team', label: 'Owner Team', type: 'text', required: true, placeholder: 'ecommerce-team' },
      { name: 'environment', label: 'Environment', type: 'select', required: true, options: [
        { value: 'development', label: 'Development' },
        { value: 'staging', label: 'Staging' },
        { value: 'production', label: 'Production' },
      ]},
      { name: 'costCenter', label: 'Cost Center', type: 'text', required: true, placeholder: 'CC-1234' },
    ],
    template: `apiVersion: zara.io/v1
kind: Namespace
metadata:
  name: {{name}}
  labels:
    team: {{team}}
    environment: {{environment}}
spec:
  owner:
    team: {{team}}
  context:
    environment: {{environment}}
    costCenter: {{costCenter}}
  quota:
    databases: 10
    applications: 20
    secrets: 50
    storageGB: 100
    maxConnections: 200
---
apiVersion: zara.io/v1
kind: Policy
metadata:
  name: {{name}}-naming-policy
  namespace: {{name}}
spec:
  type: naming
  enforcement: deny
  rules:
    - pattern: "^[a-z][a-z0-9-]*$"
      message: "Names must be lowercase alphanumeric with hyphens"`,
  },
  {
    id: 'microservice-redis',
    name: 'Microservice with Redis',
    description: 'Complete microservice setup with Redis cache and monitoring',
    icon: Zap,
    category: 'application',
    parameters: [
      { name: 'name', label: 'Service Name', type: 'text', required: true, placeholder: 'product-catalog' },
      { name: 'namespace', label: 'Namespace', type: 'text', required: true, placeholder: 'production' },
      { name: 'image', label: 'Docker Image', type: 'text', required: true, placeholder: 'myapp/product-catalog' },
      { name: 'port', label: 'Container Port', type: 'text', required: true, default: '8080' },
      { name: 'owner', label: 'Owner Team', type: 'text', required: true, placeholder: 'backend-team' },
    ],
    template: `apiVersion: zara.io/v1
kind: Application
metadata:
  name: {{name}}
  namespace: {{namespace}}
  labels:
    team: {{owner}}
    component: api
spec:
  image: {{image}}
  tag: latest
  replicas: 3
  ports:
    - containerPort: {{port}}
      name: http
  env:
    - name: REDIS_HOST
      value: {{name}}-redis
    - name: REDIS_PORT
      value: "6379"
    - name: REDIS_PASSWORD
      valueFrom:
        secretKeyRef:
          name: {{name}}-redis-password
          key: password
  resources:
    requests:
      cpu: 200m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 1Gi
  healthCheck:
    httpGet:
      path: /health
      port: {{port}}
    initialDelaySeconds: 30
    periodSeconds: 10
  livenessCheck:
    httpGet:
      path: /health/live
      port: {{port}}
---
apiVersion: zara.io/v1
kind: Application
metadata:
  name: {{name}}-redis
  namespace: {{namespace}}
  labels:
    team: {{owner}}
    component: cache
spec:
  image: redis
  tag: "7-alpine"
  ports:
    - containerPort: 6379
      name: redis
  resources:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi
  volumeMounts:
    - name: data
      mountPath: /data
  volumes:
    - name: data
      persistentVolumeClaim:
        size: 10Gi
---
apiVersion: zara.io/v1
kind: Secret
metadata:
  name: {{name}}-redis-password
  namespace: {{namespace}}
spec:
  type: generic
  data:
    password: <auto-generated>`,
  },
  {
    id: 'microservice-queue',
    name: 'Microservice with Message Queue',
    description: 'Event-driven microservice with RabbitMQ for async communication',
    icon: MessageSquare,
    category: 'application',
    parameters: [
      { name: 'name', label: 'Service Name', type: 'text', required: true, placeholder: 'order-processor' },
      { name: 'namespace', label: 'Namespace', type: 'text', required: true, placeholder: 'production' },
      { name: 'image', label: 'Docker Image', type: 'text', required: true, placeholder: 'myapp/order-processor' },
      { name: 'owner', label: 'Owner Team', type: 'text', required: true, placeholder: 'orders-team' },
      { name: 'queueName', label: 'Queue Name', type: 'text', required: true, placeholder: 'orders' },
    ],
    template: `apiVersion: zara.io/v1
kind: Application
metadata:
  name: {{name}}
  namespace: {{namespace}}
  labels:
    team: {{owner}}
    component: worker
spec:
  image: {{image}}
  tag: latest
  replicas: 2
  env:
    - name: RABBITMQ_HOST
      value: rabbitmq
    - name: RABBITMQ_PORT
      value: "5672"
    - name: RABBITMQ_USER
      valueFrom:
        secretKeyRef:
          name: {{name}}-rabbitmq-credentials
          key: username
    - name: RABBITMQ_PASSWORD
      valueFrom:
        secretKeyRef:
          name: {{name}}-rabbitmq-credentials
          key: password
    - name: QUEUE_NAME
      value: {{queueName}}
  resources:
    requests:
      cpu: 200m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 1Gi
---
apiVersion: zara.io/v1
kind: Secret
metadata:
  name: {{name}}-rabbitmq-credentials
  namespace: {{namespace}}
spec:
  type: generic
  data:
    username: <auto-generated>
    password: <auto-generated>`,
  },
  {
    id: 'observability-stack',
    name: 'Observability Stack',
    description: 'Complete observability with OpenTelemetry, Jaeger, and Prometheus',
    icon: Eye,
    category: 'observability',
    parameters: [
      { name: 'namespace', label: 'Namespace', type: 'text', required: true, placeholder: 'observability' },
      { name: 'retention', label: 'Data Retention (days)', type: 'text', required: true, default: '15' },
    ],
    template: `apiVersion: zara.io/v1
kind: Application
metadata:
  name: jaeger
  namespace: {{namespace}}
  labels:
    component: tracing
spec:
  image: jaegertracing/all-in-one
  tag: latest
  ports:
    - containerPort: 16686
      name: ui
    - containerPort: 14268
      name: collector
    - containerPort: 14250
      name: grpc
  resources:
    requests:
      cpu: 200m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 2Gi
  env:
    - name: SPAN_STORAGE_TYPE
      value: badger
    - name: BADGER_EPHEMERAL
      value: "false"
    - name: BADGER_DIRECTORY_VALUE
      value: /badger/data
    - name: BADGER_DIRECTORY_KEY
      value: /badger/key
---
apiVersion: zara.io/v1
kind: Application
metadata:
  name: otel-collector
  namespace: {{namespace}}
  labels:
    component: collector
spec:
  image: otel/opentelemetry-collector-contrib
  tag: latest
  ports:
    - containerPort: 4317
      name: otlp-grpc
    - containerPort: 4318
      name: otlp-http
    - containerPort: 8888
      name: metrics
  resources:
    requests:
      cpu: 200m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 1Gi
---
apiVersion: zara.io/v1
kind: Application
metadata:
  name: prometheus
  namespace: {{namespace}}
  labels:
    component: metrics
spec:
  image: prom/prometheus
  tag: latest
  ports:
    - containerPort: 9090
      name: web
  resources:
    requests:
      cpu: 500m
      memory: 2Gi
    limits:
      cpu: 2000m
      memory: 4Gi
  volumeMounts:
    - name: data
      mountPath: /prometheus
  volumes:
    - name: data
      persistentVolumeClaim:
        size: 50Gi
  args:
    - --storage.tsdb.retention.time={{retention}}d
    - --config.file=/etc/prometheus/prometheus.yml`,
  },
  {
    id: 'cicd-pipeline',
    name: 'CI/CD Pipeline',
    description: 'Complete CI/CD pipeline with build, test, and deployment stages',
    icon: GitBranch,
    category: 'cicd',
    parameters: [
      { name: 'name', label: 'Pipeline Name', type: 'text', required: true, placeholder: 'orders-api-pipeline' },
      { name: 'namespace', label: 'Namespace', type: 'text', required: true, placeholder: 'production' },
      { name: 'repository', label: 'Git Repository', type: 'text', required: true, placeholder: 'github.com/org/orders-api' },
      { name: 'branch', label: 'Branch', type: 'text', required: true, default: 'main' },
      { name: 'appName', label: 'Application Name', type: 'text', required: true, placeholder: 'orders-api' },
    ],
    template: `apiVersion: zara.io/v1
kind: RuntimePolicy
metadata:
  name: {{name}}-deployment-policy
  namespace: {{namespace}}
spec:
  description: Automated deployment policy for {{appName}}
  enabled: true
  triggers:
    - type: git-push
      source: {{repository}}
      conditions:
        branch: {{branch}}
  scope:
    namespaces:
      - {{namespace}}
    kinds:
      - Application
    labels:
      app: {{appName}}
  action:
    type: deploy
    stages:
      - name: build
        steps:
          - name: checkout
            action: git-clone
            params:
              repository: {{repository}}
              branch: {{branch}}
          - name: test
            action: run-tests
            params:
              command: npm test
          - name: build-image
            action: docker-build
            params:
              context: .
              dockerfile: Dockerfile
              tags:
                - latest
                - \${GIT_COMMIT_SHA}
      - name: deploy
        steps:
          - name: update-manifest
            action: update-image-tag
            params:
              application: {{appName}}
              namespace: {{namespace}}
              tag: \${GIT_COMMIT_SHA}
          - name: apply
            action: kubectl-apply
            params:
              manifest: k8s/application.yaml
      - name: verify
        steps:
          - name: health-check
            action: http-request
            params:
              url: https://{{appName}}.{{namespace}}.svc/health
              expectedStatus: 200
              retries: 10
              interval: 10s
    notifyChannels:
      - slack: #deployments
      - email: {{namespace}}-team@example.com`,
  },
  {
    id: 'business-domain',
    name: 'Business Domain',
    description: 'Complete business domain with boundaries, teams, and SLA',
    icon: Building2,
    category: 'organization',
    parameters: [
      { name: 'name', label: 'Domain Name', type: 'text', required: true, placeholder: 'payments' },
      { name: 'displayName', label: 'Display Name', type: 'text', required: true, placeholder: 'Payment Processing' },
      { name: 'team', label: 'Owner Team', type: 'text', required: true, placeholder: 'payments-team' },
      { name: 'tier', label: 'Service Tier', type: 'select', required: true, options: [
        { value: 'tier1', label: 'Tier 1 (Critical - 99.99%)' },
        { value: 'tier2', label: 'Tier 2 (Important - 99.9%)' },
        { value: 'tier3', label: 'Tier 3 (Standard - 99.5%)' },
      ]},
    ],
    template: `apiVersion: zara.io/v1
kind: BusinessDomain
metadata:
  name: {{name}}
  namespace: platform
  labels:
    tier: {{tier}}
spec:
  displayName: {{displayName}}
  description: Business domain for {{displayName}}
  ownership:
    team: {{team}}
    techLead: tech-lead@example.com
    productOwner: product@example.com
    costCenter: CC-{{name}}
  boundaries:
    namespaces:
      - {{name}}-prod
      - {{name}}-staging
      - {{name}}-dev
    resourceKinds:
      - Application
      - PostgresDatabase
      - PostgresSchema
      - Secret
  sla:
    tier: {{tier}}
    availability: "99.99%"
    rto: "1h"
    rpo: "15m"
  compliance:
    frameworks:
      - PCI-DSS
      - SOC2
    dataClassification: confidential
  tags:
    - financial
    - customer-facing
---
apiVersion: zara.io/v1
kind: Team
metadata:
  name: {{team}}
  namespace: platform
spec:
  displayName: {{displayName}} Team
  description: Team responsible for {{displayName}}
  owners:
    - email: tech-lead@example.com
      name: Tech Lead
      role: tech-lead
  channels:
    general: "#{{name}}-team"
    alerts: "#{{name}}-alerts"
    incidents: "#{{name}}-incidents"
    deployments: "#{{name}}-deployments"
  costCenter: CC-{{name}}
  oncall:
    primaryChannel: "#{{name}}-oncall"
    escalation:
      - level: 1
        contacts:
          - oncall-primary@example.com
        waitMinutes: 15
      - level: 2
        contacts:
          - oncall-secondary@example.com
        waitMinutes: 30`,
  },
  {
    id: 'monitoring-stack',
    name: 'Monitoring Stack',
    description: 'Complete monitoring with Prometheus, Grafana, and AlertManager',
    icon: Workflow,
    category: 'observability',
    parameters: [
      { name: 'namespace', label: 'Namespace', type: 'text', required: true, placeholder: 'monitoring' },
      { name: 'retention', label: 'Metrics Retention (days)', type: 'text', required: true, default: '30' },
      { name: 'alertChannel', label: 'Alert Channel', type: 'text', required: true, placeholder: '#alerts' },
    ],
    template: `apiVersion: zara.io/v1
kind: Application
metadata:
  name: prometheus
  namespace: {{namespace}}
  labels:
    component: metrics
spec:
  image: prom/prometheus
  tag: latest
  ports:
    - containerPort: 9090
      name: web
  resources:
    requests:
      cpu: 500m
      memory: 2Gi
    limits:
      cpu: 2000m
      memory: 4Gi
  volumeMounts:
    - name: data
      mountPath: /prometheus
    - name: config
      mountPath: /etc/prometheus
  volumes:
    - name: data
      persistentVolumeClaim:
        size: 100Gi
    - name: config
      configMap:
        name: prometheus-config
  args:
    - --storage.tsdb.retention.time={{retention}}d
    - --config.file=/etc/prometheus/prometheus.yml
    - --web.enable-lifecycle
---
apiVersion: zara.io/v1
kind: Application
metadata:
  name: grafana
  namespace: {{namespace}}
  labels:
    component: visualization
spec:
  image: grafana/grafana
  tag: latest
  ports:
    - containerPort: 3000
      name: web
  resources:
    requests:
      cpu: 200m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 1Gi
  volumeMounts:
    - name: data
      mountPath: /var/lib/grafana
  volumes:
    - name: data
      persistentVolumeClaim:
        size: 10Gi
  env:
    - name: GF_SECURITY_ADMIN_PASSWORD
      valueFrom:
        secretKeyRef:
          name: grafana-admin
          key: password
    - name: GF_INSTALL_PLUGINS
      value: grafana-piechart-panel
---
apiVersion: zara.io/v1
kind: Application
metadata:
  name: alertmanager
  namespace: {{namespace}}
  labels:
    component: alerting
spec:
  image: prom/alertmanager
  tag: latest
  ports:
    - containerPort: 9093
      name: web
  resources:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi
  volumeMounts:
    - name: config
      mountPath: /etc/alertmanager
  volumes:
    - name: config
      configMap:
        name: alertmanager-config
---
apiVersion: zara.io/v1
kind: Secret
metadata:
  name: grafana-admin
  namespace: {{namespace}}
spec:
  type: generic
  data:
    password: <auto-generated>`,
  },
];

const categoryLabels: Record<string, string> = {
  database: 'Databases',
  application: 'Applications',
  infrastructure: 'Infrastructure',
  observability: 'Observability & Monitoring',
  cicd: 'CI/CD & Automation',
  organization: 'Organization & Governance',
};

export function GoldenPathsPage() {
  const [selectedPath, setSelectedPath] = useState<GoldenPath | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [generatedYaml, setGeneratedYaml] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyStatus, setApplyStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message?: string;
    details?: Array<{ resource: string; status: 'success' | 'error'; message?: string }>;
  }>({ type: 'idle' });

  const handleSelectPath = (path: GoldenPath) => {
    setSelectedPath(path);
    // Initialize form with defaults
    const defaults: Record<string, string> = {};
    path.parameters.forEach((param) => {
      if (param.default) {
        defaults[param.name] = param.default;
      }
    });
    setFormValues(defaults);
    setGeneratedYaml('');
    setCopied(false);
    setApplyStatus({ type: 'idle' });
  };

  const handleInputChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = () => {
    if (!selectedPath) return;

    let yaml = selectedPath.template;
    Object.entries(formValues).forEach(([key, value]) => {
      yaml = yaml.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    setGeneratedYaml(yaml);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBack = () => {
    setSelectedPath(null);
    setFormValues({});
    setGeneratedYaml('');
    setApplyStatus({ type: 'idle' });
  };

  const handleApply = async () => {
    if (!generatedYaml) {
      setApplyStatus({ type: 'error', message: 'Please generate YAML first' });
      return;
    }

    setApplying(true);
    setApplyStatus({ type: 'idle' });

    try {
      // Use the new /apply endpoint to send the entire YAML at once
      const result = await api.applyYaml(generatedYaml);

      // Transform backend response to frontend format
      const details = result.results.map(r => ({
        resource: `${r.kind}/${r.namespace}/${r.name}`,
        status: r.action === 'ERROR' ? 'error' as const : 'success' as const,
        message: r.error || (r.action === 'CREATED' ? 'Created' : 'Updated'),
      }));

      const hasErrors = result.summary.failed > 0;
      setApplyStatus({
        type: hasErrors ? 'error' : 'success',
        message: hasErrors
          ? `Applied ${result.summary.created + result.summary.updated}/${result.summary.total} resources (${result.summary.failed} failed)`
          : `Successfully applied ${result.summary.total} resource(s) (${result.summary.created} created, ${result.summary.updated} updated)`,
        details,
      });
    } catch (error: any) {
      setApplyStatus({
        type: 'error',
        message: error.message || 'Failed to apply resources',
      });
    } finally {
      setApplying(false);
    }
  };

  const isFormValid = () => {
    if (!selectedPath) return false;
    return selectedPath.parameters.every(
      (param) => !param.required || (formValues[param.name] && formValues[param.name].trim() !== '')
    );
  };

  // Group paths by category
  const pathsByCategory = goldenPaths.reduce(
    (acc, path) => {
      if (!acc[path.category]) acc[path.category] = [];
      acc[path.category].push(path);
      return acc;
    },
    {} as Record<string, GoldenPath[]>
  );

  if (selectedPath) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            ← Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <selectedPath.icon className="h-6 w-6 text-blue-400" />
              {selectedPath.name}
            </h1>
            <p className="text-slate-400 mt-1">{selectedPath.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPath.parameters.map((param) => (
                <div key={param.name}>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    {param.label}
                    {param.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  {param.type === 'select' ? (
                    <Select
                      options={param.options || []}
                      value={formValues[param.name] || ''}
                      onChange={(e) => handleInputChange(param.name, e.target.value)}
                    />
                  ) : (
                    <Input
                      value={formValues[param.name] || ''}
                      onChange={(e) => handleInputChange(param.name, e.target.value)}
                      placeholder={param.placeholder}
                    />
                  )}
                </div>
              ))}

              <Button onClick={handleGenerate} disabled={!isFormValid()} className="w-full mt-4">
                <FileCode className="h-4 w-4 mr-2" />
                Generate YAML
              </Button>
            </CardContent>
          </Card>

          {/* Generated Output */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Generated Manifest</span>
                {generatedYaml && (
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedYaml ? (
                <div className="space-y-4">
                  {/* Status Messages */}
                  {applyStatus.type === 'success' && (
                    <Alert type="success" title="Successfully Applied!">
                      {applyStatus.message}
                      {applyStatus.details && (
                        <ul className="mt-2 space-y-1 text-sm">
                          {applyStatus.details.map((detail, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              {detail.resource}
                            </li>
                          ))}
                        </ul>
                      )}
                    </Alert>
                  )}
                  
                  {applyStatus.type === 'error' && (
                    <Alert type="error" title="Error">
                      {applyStatus.message}
                      {applyStatus.details && (
                        <ul className="mt-2 space-y-1 text-sm">
                          {applyStatus.details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-2">
                              {detail.status === 'success' ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-400 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <div>{detail.resource}</div>
                                {detail.message && (
                                  <div className="text-xs text-slate-400 mt-0.5">{detail.message}</div>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Alert>
                  )}

                  {/* YAML Preview */}
                  <div className="relative">
                    <pre className="bg-slate-900 rounded-lg p-4 text-sm text-slate-300 overflow-x-auto max-h-[400px] overflow-y-auto">
                      <code>{generatedYaml}</code>
                    </pre>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleApply} 
                      disabled={applying || applyStatus.type === 'success'}
                      className="flex-1"
                    >
                      {applying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Applying...
                        </>
                      ) : applyStatus.type === 'success' ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Applied
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Apply to Platform
                        </>
                      )}
                    </Button>
                  </div>

                  {/* CLI Alternative */}
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-slate-400 flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      Or use CLI: <code className="text-blue-400">zaractl apply -f manifest.yaml</code>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <FileCode className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Fill in the configuration and click Generate</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        icon={<Sparkles className="h-6 w-6" />}
        iconClassName="text-yellow-400"
        title="Golden Paths"
        description="Pre-approved templates for common infrastructure patterns"
      />

      <Alert type="info" title="What are Golden Paths?">
        Golden Paths are pre-configured templates that follow your organization's best practices.
        They help teams quickly create resources while maintaining consistency and compliance.
      </Alert>

      {/* Paths by Category */}
      {Object.entries(pathsByCategory).map(([category, paths]) => (
        <div key={category}>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">{categoryLabels[category]}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paths.map((path) => (
              <button
                key={path.id}
                onClick={() => handleSelectPath(path)}
                className="text-left w-full"
              >
                <Card className="cursor-pointer hover:bg-slate-700/50 transition-colors group h-full">
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30 transition-colors">
                        <path.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {path.name}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">{path.description}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

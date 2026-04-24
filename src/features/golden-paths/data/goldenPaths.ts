import {
  Building2,
  Box,
  Database,
  Eye,
  GitBranch,
  Globe,
  Key,
  MessageSquare,
  Server,
  Workflow,
  Zap,
} from 'lucide-react';
import type { GoldenPath, GoldenPathCategory } from '../types';

export const goldenPaths: GoldenPath[] = [
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

export const categoryLabels: Record<GoldenPathCategory, string> = {
  database: 'Databases',
  application: 'Applications',
  infrastructure: 'Infrastructure',
  observability: 'Observability & Monitoring',
  cicd: 'CI/CD & Automation',
  organization: 'Organization & Governance',
};

export const goldenPathCategoryOrder: GoldenPathCategory[] = [
  'database',
  'application',
  'infrastructure',
  'observability',
  'cicd',
  'organization',
];

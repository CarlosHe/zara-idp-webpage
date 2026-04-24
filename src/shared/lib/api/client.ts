import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type {
  Resource,
  ResourceEvent,
  ResourceDependency,
  Namespace,
  Team,
  Approval,
  AuditEntry,
  Freeze,
  RuntimePolicy,
  CorrelationResult,
  BlastRadius,
  DashboardSummary,
  DashboardHealth,
  ResourceKind,
  ApiResponse,
  ApiError,
  PaginationParams,
  ReconcileJobResponse,
  DriftReport,
} from '@/shared/types';

// API Client singleton
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        const apiError: ApiError = error.response?.data || {
          code: 'UNKNOWN_ERROR',
          message: error.message || 'An unexpected error occurred',
        };
        return Promise.reject(apiError);
      }
    );
  }

  // Health endpoints
  async health(): Promise<{ status: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  async ready(): Promise<{ status: string }> {
    const response = await this.client.get('/ready');
    return response.data;
  }

  // Resource endpoints
  async listResources(params?: PaginationParams): Promise<Resource[]> {
    const response = await this.client.get('/resources', { params });
    // API returns { items: [...], total: N }
    const items = response.data.items || response.data || [];
    return this.normalizeResources(items);
  }

  async listResourcesByKind(kind: ResourceKind, params?: PaginationParams): Promise<Resource[]> {
    const response = await this.client.get(`/resources/${kind}`, { params });
    // API returns { items: [...], total: N }
    const items = response.data.items || response.data || [];
    return this.normalizeResources(items);
  }

  // Normalize API resource format to frontend Resource type
  private normalizeResources(items: any[]): Resource[] {
    return items.map((item: any) => {
      const namespace = item.metadata?.namespace || item.namespace || 'default';
      const name = item.metadata?.name || item.name || 'unknown';
      const labels = item.metadata?.labels || item.labels || {};
      const annotations = item.metadata?.annotations || item.annotations || {};
      return {
        id: item.id || `${item.kind}-${namespace}-${name}`,
        kind: item.kind as ResourceKind,
        metadata: { name, namespace, labels, annotations },
        spec: item.spec || {},
        status: item.status || 'Unknown',
        version: typeof item.version === 'number' ? item.version : Number(item.version) || 1,
        createdAt: item.createdAt || item.metadata?.creationTimestamp || new Date().toISOString(),
        updatedAt: item.updatedAt || item.metadata?.creationTimestamp || new Date().toISOString(),
        // Legacy fields kept for backward compatibility with components that still use the flat shape.
        namespace,
        name,
        healthStatus: this.mapStatus(item.status) as any,
        syncStatus: item.syncStatus || 'Synced',
        labels,
        annotations,
        ownership: item.ownership,
      };
    });
  }

  private mapStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'Ready': 'Healthy',
      'NotReady': 'Degraded',
      'Pending': 'Progressing',
      'Unknown': 'Unknown',
      'Healthy': 'Healthy',
      'Degraded': 'Degraded',
      'Progressing': 'Progressing',
    };
    return statusMap[status] || status || 'Unknown';
  }

  async getResource(kind: ResourceKind, namespace: string, name: string): Promise<Resource> {
    const response = await this.client.get(`/resources/${kind}/${namespace}/${name}`);
    return response.data;
  }

  async getResourceEvents(kind: ResourceKind, namespace: string, name: string): Promise<ResourceEvent[]> {
    const response = await this.client.get(`/resources/${kind}/${namespace}/${name}/events`);
    return response.data;
  }

  async getResourceDependencies(kind: ResourceKind, namespace: string, name: string): Promise<ResourceDependency[]> {
    const response = await this.client.get(`/resources/${kind}/${namespace}/${name}/dependencies`);
    return response.data;
  }

  // Resource CRUD operations
  async createResource(data: {
    kind: string;
    name: string;
    namespace: string;
    spec?: Record<string, any>;
    metadata?: {
      labels?: Record<string, string>;
      annotations?: Record<string, string>;
    };
  }): Promise<Resource> {
    const response = await this.client.post('/resources', data);
    return response.data;
  }

  async updateResource(
    kind: ResourceKind,
    namespace: string,
    name: string,
    data: {
      spec?: Record<string, any>;
      metadata?: {
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
      };
    }
  ): Promise<Resource> {
    const response = await this.client.put(`/resources/${kind}/${namespace}/${name}`, data);
    return response.data;
  }

  async deleteResource(id: string): Promise<void> {
    await this.client.delete(`/resources/${id}`);
  }

  // Apply resources from YAML (batch create/update)
  async applyYaml(yaml: string): Promise<{
    results: Array<{
      kind: string;
      name: string;
      namespace: string;
      action: 'CREATED' | 'UPDATED' | 'ERROR';
      error?: string;
    }>;
    summary: {
      total: number;
      created: number;
      updated: number;
      failed: number;
    };
  }> {
    const response = await this.client.post('/apply', { yaml });
    return response.data;
  }

  // Namespace endpoints
  async listNamespaces(): Promise<Namespace[]> {
    const response = await this.client.get('/namespaces');
    // API returns { items: [...], total: N }
    const items = response.data.items || response.data || [];
    return items;
  }

  async getNamespace(id: string): Promise<Namespace> {
    const response = await this.client.get(`/namespaces/${id}`);
    return response.data;
  }

  async getNamespaceResources(id: string, params?: PaginationParams): Promise<ApiResponse<Resource[]>> {
    const response = await this.client.get(`/namespaces/${id}/resources`, { params });
    return response.data;
  }

  // Namespace CRUD operations
  async createNamespace(data: Omit<Namespace, 'createdAt' | 'updatedAt' | 'status'>): Promise<Namespace> {
    const response = await this.client.post('/namespaces', data);
    return response.data;
  }

  async updateNamespace(id: string, data: Partial<Namespace>): Promise<Namespace> {
    const response = await this.client.put(`/namespaces/${id}`, data);
    return response.data;
  }

  async deleteNamespace(id: string): Promise<void> {
    await this.client.delete(`/namespaces/${id}`);
  }

  // Team endpoints
  async listTeams(): Promise<Team[]> {
    const response = await this.client.get('/teams');
    // API returns { items: [...], total: N }
    return response.data.items || response.data || [];
  }

  async getTeam(id: string): Promise<Team> {
    const response = await this.client.get(`/teams/${id}`);
    return response.data;
  }

  async getTeamResources(id: string, params?: PaginationParams): Promise<ApiResponse<Resource[]>> {
    const response = await this.client.get(`/teams/${id}/resources`, { params });
    return response.data;
  }

  async getTeamOnCall(id: string): Promise<{ primary: string; secondary?: string }> {
    const response = await this.client.get(`/teams/${id}/oncall`);
    return response.data;
  }

  // Team CRUD operations
  async createTeam(data: {
    name: string;
    namespace?: string;
    displayName?: string;
    slackChannel?: string;
  }): Promise<Team> {
    const response = await this.client.post('/teams', data);
    return response.data;
  }

  async updateTeam(id: string, data: {
    displayName?: string;
    slackChannel?: string;
  }): Promise<Team> {
    const response = await this.client.put(`/teams/${id}`, data);
    return response.data;
  }

  async deleteTeam(id: string): Promise<void> {
    await this.client.delete(`/teams/${id}`);
  }

  // Approval endpoints (READ-ONLY except approve/reject)
  async listApprovals(params?: PaginationParams & { status?: string }): Promise<Approval[]> {
    const response = await this.client.get('/approvals', { params });
    // API returns { items: [...], total: N }
    return response.data.items || response.data || [];
  }

  async getApproval(id: string): Promise<Approval> {
    const response = await this.client.get(`/approvals/${id}`);
    return response.data;
  }

  // WRITE operations - only approvals
  async approveRequest(id: string, comment?: string): Promise<Approval> {
    const response = await this.client.post(`/approvals/${id}/approve`, { comment });
    return response.data;
  }

  async rejectRequest(id: string, reason: string): Promise<Approval> {
    const response = await this.client.post(`/approvals/${id}/reject`, { reason });
    return response.data;
  }

  // Audit endpoints
  async listAuditLogs(params?: PaginationParams & { 
    resourceKind?: string;
    resourceNamespace?: string;
    resourceName?: string;
    actor?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<AuditEntry[]> {
    const response = await this.client.get('/audit', { params });
    // API returns { items: [...], total: N }
    return response.data.items || response.data || [];
  }

  async getAuditEntry(id: string): Promise<AuditEntry> {
    const response = await this.client.get(`/audit/${id}`);
    return response.data;
  }

  // Freeze endpoints
  async listFreezes(): Promise<Freeze[]> {
    const response = await this.client.get('/freezes');
    // API returns { items: [...], total: N }
    return response.data.items || response.data || [];
  }

  async getFreeze(id: string): Promise<Freeze> {
    const response = await this.client.get(`/freezes/${id}`);
    return response.data;
  }

  // Runtime Policy endpoints
  async listRuntimePolicies(): Promise<RuntimePolicy[]> {
    const response = await this.client.get('/policies/runtime');
    // API returns { items: [...], total: N }
    return response.data.items || response.data || [];
  }

  async getRuntimePolicy(namespace: string, name: string): Promise<RuntimePolicy> {
    const response = await this.client.get(`/policies/runtime/${namespace}/${name}`);
    return response.data;
  }

  // Correlation endpoints
  async correlateResource(kind: ResourceKind, namespace: string, name: string): Promise<CorrelationResult> {
    const response = await this.client.get(`/correlate/${kind}/${namespace}/${name}`);
    return response.data;
  }

  async getBlastRadius(kind: ResourceKind, namespace: string, name: string): Promise<BlastRadius> {
    const response = await this.client.get(`/blast-radius/${kind}/${namespace}/${name}`);
    return response.data;
  }

  // Dashboard endpoints
  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await this.client.get('/dashboard/summary');
    return response.data;
  }

  async getDashboardHealth(): Promise<DashboardHealth> {
    const response = await this.client.get('/dashboard/health');
    return response.data;
  }

  // Cluster endpoints
  async listClusters(params?: { provider?: string; environment?: string }): Promise<any[]> {
    const response = await this.client.get('/clusters', { params });
    return response.data.items || response.data || [];
  }

  async getCluster(id: string): Promise<any> {
    const response = await this.client.get(`/clusters/${id}`);
    return response.data;
  }

  async getClusterResources(id: string): Promise<any> {
    const response = await this.client.get(`/clusters/${id}/resources`);
    return response.data;
  }

  async getClusterHealth(id: string): Promise<any> {
    const response = await this.client.get(`/clusters/${id}/health`);
    return response.data;
  }

  // Cluster CRUD operations
  async createCluster(data: {
    name: string;
    namespace?: string;
    displayName?: string;
    provider: string;
    environment: string;
    region: string;
  }): Promise<any> {
    const response = await this.client.post('/clusters', data);
    return response.data;
  }

  async updateCluster(id: string, data: {
    displayName?: string;
    environment?: string;
  }): Promise<any> {
    const response = await this.client.put(`/clusters/${id}`, data);
    return response.data;
  }

  async deleteCluster(id: string): Promise<void> {
    await this.client.delete(`/clusters/${id}`);
  }

  // Business Domain endpoints
  async listBusinessDomains(): Promise<any[]> {
    const response = await this.client.get('/domains');
    return response.data.items || response.data || [];
  }

  async getBusinessDomain(id: string): Promise<any> {
    const response = await this.client.get(`/domains/${id}`);
    return response.data;
  }

  async getBusinessDomainResources(id: string): Promise<any> {
    const response = await this.client.get(`/domains/${id}/resources`);
    return response.data;
  }

  // Business Domain CRUD operations
  async createBusinessDomain(data: {
    name: string;
    namespace?: string;
    displayName?: string;
    description?: string;
    team: string;
  }): Promise<any> {
    const response = await this.client.post('/domains', data);
    return response.data;
  }

  async updateBusinessDomain(id: string, data: {
    displayName?: string;
    description?: string;
    team?: string;
  }): Promise<any> {
    const response = await this.client.put(`/domains/${id}`, data);
    return response.data;
  }

  async deleteBusinessDomain(id: string): Promise<void> {
    await this.client.delete(`/domains/${id}`);
  }

  // Analytics endpoints
  async getAnalyticsSummary(): Promise<any> {
    const response = await this.client.get('/analytics/summary');
    return response.data;
  }

  async getAnalyticsResources(): Promise<any> {
    const response = await this.client.get('/analytics/resources');
    return response.data;
  }

  async getAnalyticsTeams(): Promise<any> {
    const response = await this.client.get('/analytics/teams');
    return response.data;
  }

  async getAnalyticsClusters(): Promise<any> {
    const response = await this.client.get('/analytics/clusters');
    return response.data;
  }

  async getAnalyticsDomains(): Promise<any> {
    const response = await this.client.get('/analytics/domains');
    return response.data;
  }

  async getAnalyticsTrends(period: '7d' | '30d' | '90d' = '7d'): Promise<any> {
    const response = await this.client.get('/analytics/trends', { params: { period } });
    return response.data;
  }

  // Reconciliation and Drift Detection endpoints
  async reconcileResource(resourceId: string): Promise<ReconcileJobResponse> {
    const response = await this.client.post(`/resources/${resourceId}/reconcile`);
    return response.data;
  }

  async detectDrift(resourceId: string): Promise<DriftReport> {
    const response = await this.client.get(`/resources/${resourceId}/drift`);
    return response.data;
  }
}

// Export singleton instance
export const api = new ApiClient();

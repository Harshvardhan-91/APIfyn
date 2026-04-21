export type ApiResult<T> = {
  success: boolean;
} & T;

export type DashboardData = {
  totalWorkflows: number;
  executionsToday: number;
  connectedApps: number;
  thisWeek: number;
  plan?: {
    name: string;
    type: string;
    subscriptionStatus?: string;
    subscriptionEndDate?: string;
    workflowsUsed: number;
    workflowsLimit: number;
    apiCallsUsed: number;
    apiCallsLimit: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    name?: string;
    description?: string;
    duration?: string;
    status: string;
    timestamp: string;
  }>;
};

export type WorkflowBlock = {
  id: string;
  type: string;
  name: string;
  description?: string;
  position: { x: number; y: number };
  config?: Record<string, unknown>;
  status?: string;
  integrationRequired?: boolean;
  integrationStatus?: string;
  category?: string;
};

export type WorkflowConnection = {
  id: string;
  from: string;
  to: string;
  status?: string;
};

export type Workflow = {
  id: string;
  name: string;
  description?: string | null;
  definition?: {
    blocks?: WorkflowBlock[];
    connections?: WorkflowConnection[];
    canvas?: { zoom?: number; position?: { x: number; y: number } };
  };
  category?: string | null;
  triggerType?: "MANUAL" | "WEBHOOK";
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastRunAt?: string | null;
  totalRuns?: number;
  successfulRuns?: number;
  failedRuns?: number;
  avgExecutionTime?: number | null;
  executions?: Array<{
    id: string;
    status: string;
    startedAt: string;
    completedAt?: string | null;
    errorMessage?: string | null;
  }>;
};

export type IntegrationStatus = {
  github: { connected: boolean; user: unknown; loading?: boolean };
  slack: { connected: boolean; workspaces: unknown[]; loading?: boolean };
};

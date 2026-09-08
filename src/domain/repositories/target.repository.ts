import type { CheckType, Target, TargetConfig } from '../entities/target.entity.js';

export interface CreateTargetInput {
  readonly tenantId: string;
  readonly name: string;
  readonly type: CheckType;
  readonly config: TargetConfig;
  readonly intervalSeconds: number;
  readonly timeoutMs: number;
  readonly enabled: boolean;
}

export interface UpdateTargetInput {
  readonly name?: string;
  readonly config?: TargetConfig;
  readonly intervalSeconds?: number;
  readonly timeoutMs?: number;
  readonly enabled?: boolean;
}

export interface ITargetRepository {
  create(input: CreateTargetInput): Promise<Target>;
  findById(tenantId: string, id: string): Promise<Target | null>;
  listByTenant(tenantId: string): Promise<Target[]>;
  listAllEnabled(): Promise<Target[]>;
  update(tenantId: string, id: string, input: UpdateTargetInput): Promise<Target | null>;
  delete(tenantId: string, id: string): Promise<boolean>;
}

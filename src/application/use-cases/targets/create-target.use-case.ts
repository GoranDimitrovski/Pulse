import { Target } from '../../../domain/entities/target.entity.js';
import type { CheckType, TargetConfig } from '../../../domain/entities/target.entity.js';
import type { ITargetRepository } from '../../../domain/repositories/target.repository.js';

export interface CreateTargetInput {
  readonly tenantId: string;
  readonly name: string;
  readonly type: CheckType;
  readonly config: TargetConfig;
  readonly intervalSeconds: number;
  readonly timeoutMs: number;
  readonly enabled: boolean;
}

export class CreateTargetUseCase {
  constructor(private readonly targets: ITargetRepository) {}

  async execute(input: CreateTargetInput): Promise<Target> {
    Target.validateConfig(input.type, input.config);
    return this.targets.create(input);
  }
}

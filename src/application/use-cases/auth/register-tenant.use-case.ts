import { ConflictError } from '../../../domain/errors/domain-error.js';
import type { ITenantRepository } from '../../../domain/repositories/tenant.repository.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.js';
import { Email } from '../../../domain/value-objects/email.js';
import { slugify } from '../../../shared/slugify.js';
import type { IPasswordHasher } from '../../ports/password-hasher.port.js';

export interface RegisterTenantInput {
  readonly tenantName: string;
  readonly email: string;
  readonly password: string;
}

export interface RegisterTenantResult {
  readonly tenantId: string;
  readonly userId: string;
}

export class RegisterTenantUseCase {
  constructor(
    private readonly tenants: ITenantRepository,
    private readonly users: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: RegisterTenantInput): Promise<RegisterTenantResult> {
    const email = Email.create(input.email);

    const existingUser = await this.users.findByEmail(email.value);
    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    const slug = await this.resolveUniqueSlug(input.tenantName);
    const tenant = await this.tenants.create({ name: input.tenantName, slug });

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.users.create({
      tenantId: tenant.id,
      email: email.value,
      passwordHash,
      role: 'owner',
    });

    return { tenantId: tenant.id, userId: user.id };
  }

  private async resolveUniqueSlug(tenantName: string): Promise<string> {
    const base = slugify(tenantName) || 'tenant';
    let candidate = base;
    let suffix = 1;
    while (await this.tenants.findBySlug(candidate)) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    return candidate;
  }
}

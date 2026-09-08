import { beforeEach, describe, expect, it } from 'vitest';

import { RegisterTenantUseCase } from '../../../src/application/use-cases/auth/register-tenant.use-case.js';
import { ConflictError } from '../../../src/domain/errors/domain-error.js';
import { FakePasswordHasher } from '../../fakes/fake-password-hasher.js';
import { InMemoryTenantRepository } from '../../fakes/in-memory-tenant.repository.js';
import { InMemoryUserRepository } from '../../fakes/in-memory-user.repository.js';

describe('RegisterTenantUseCase', () => {
  let tenants: InMemoryTenantRepository;
  let users: InMemoryUserRepository;
  let useCase: RegisterTenantUseCase;

  beforeEach(() => {
    tenants = new InMemoryTenantRepository();
    users = new InMemoryUserRepository();
    useCase = new RegisterTenantUseCase(tenants, users, new FakePasswordHasher());
  });

  it('creates a tenant and an owner user', async () => {
    const result = await useCase.execute({
      tenantName: 'Acme Inc',
      email: 'owner@acme.test',
      password: 'password123',
    });

    expect(tenants.tenants).toHaveLength(1);
    expect(tenants.tenants[0]!.slug).toBe('acme-inc');

    const user = users.users[0]!;
    expect(user.role).toBe('owner');
    expect(user.tenantId).toBe(result.tenantId);
    expect(user.passwordHash).toBe('hashed:password123');
  });

  it('rejects a duplicate email', async () => {
    await useCase.execute({ tenantName: 'Acme', email: 'dup@test.com', password: 'password123' });

    await expect(
      useCase.execute({ tenantName: 'Other Co', email: 'dup@test.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('treats emails as case-insensitive for both storage and the duplicate check', async () => {
    await useCase.execute({ tenantName: 'Acme', email: 'Dup@Test.com', password: 'password123' });

    expect(users.users[0]!.email).toBe('dup@test.com');
    await expect(
      useCase.execute({ tenantName: 'Other Co', email: 'dup@test.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('disambiguates tenant slugs on name collision', async () => {
    await useCase.execute({ tenantName: 'Acme', email: 'a@test.com', password: 'password123' });
    await useCase.execute({ tenantName: 'Acme', email: 'b@test.com', password: 'password123' });

    const slugs = tenants.tenants.map((t) => t.slug).sort();
    expect(slugs).toEqual(['acme', 'acme-2']);
  });
});

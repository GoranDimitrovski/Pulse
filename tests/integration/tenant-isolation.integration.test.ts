import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { setupTestApp } from './setup.js';

interface LoginResponse {
  accessToken: string;
}

interface TargetResponse {
  id: string;
  tenantId: string;
  name: string;
}

interface ApiKeyResponse {
  plainTextKey: string;
}

describe('Tenant isolation (integration)', () => {
  let ctx: Awaited<ReturnType<typeof setupTestApp>>;

  beforeAll(async () => {
    ctx = await setupTestApp();
  });

  afterAll(async () => {
    await ctx.teardown();
  });

  beforeEach(async () => {
    await ctx.truncateAll();
  });

  async function registerAndLogin(tenantName: string, email: string): Promise<string> {
    await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { tenantName, email, password: 'password123' },
    });
    const login = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password: 'password123' },
    });
    return login.json<LoginResponse>().accessToken;
  }

  it("cannot read another tenant's target", async () => {
    const tokenA = await registerAndLogin('Tenant A', 'a-owner@test.com');
    const tokenB = await registerAndLogin('Tenant B', 'b-owner@test.com');

    const created = await ctx.app.inject({
      method: 'POST',
      url: '/api/targets',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        name: 'Tenant A Target',
        type: 'http',
        config: { url: 'https://example.com' },
        intervalSeconds: 60,
        timeoutMs: 5000,
      },
    });
    expect(created.statusCode).toBe(201);
    const targetId = created.json<TargetResponse>().id;

    const crossTenantGet = await ctx.app.inject({
      method: 'GET',
      url: `/api/targets/${targetId}`,
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(crossTenantGet.statusCode).toBe(404);

    const crossTenantDelete = await ctx.app.inject({
      method: 'DELETE',
      url: `/api/targets/${targetId}`,
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(crossTenantDelete.statusCode).toBe(404);

    const ownTenantGet = await ctx.app.inject({
      method: 'GET',
      url: `/api/targets/${targetId}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(ownTenantGet.statusCode).toBe(200);
  });

  it('only lists targets belonging to the caller tenant', async () => {
    const tokenA = await registerAndLogin('Tenant A', 'a2-owner@test.com');
    const tokenB = await registerAndLogin('Tenant B', 'b2-owner@test.com');

    await ctx.app.inject({
      method: 'POST',
      url: '/api/targets',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        name: 'A target',
        type: 'tcp',
        config: { host: 'a.test', port: 443 },
        intervalSeconds: 60,
        timeoutMs: 5000,
      },
    });
    await ctx.app.inject({
      method: 'POST',
      url: '/api/targets',
      headers: { authorization: `Bearer ${tokenB}` },
      payload: {
        name: 'B target',
        type: 'tcp',
        config: { host: 'b.test', port: 443 },
        intervalSeconds: 60,
        timeoutMs: 5000,
      },
    });

    const listA = await ctx.app.inject({
      method: 'GET',
      url: '/api/targets',
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const targetsA = listA.json<TargetResponse[]>();
    expect(targetsA).toHaveLength(1);
    expect(targetsA[0]!.name).toBe('A target');
  });

  it('ignores a tenantId supplied in the request body and uses the JWT tenant instead', async () => {
    const tokenA = await registerAndLogin('Tenant A', 'a3-owner@test.com');

    const created = await ctx.app.inject({
      method: 'POST',
      url: '/api/targets',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        tenantId: 'attacker-supplied-tenant-id',
        name: 'Spoof attempt',
        type: 'http',
        config: { url: 'https://example.com' },
        intervalSeconds: 60,
        timeoutMs: 5000,
      },
    });

    expect(created.statusCode).toBe(201);
    expect(created.json<TargetResponse>().tenantId).not.toBe('attacker-supplied-tenant-id');
  });

  it('enforces role-based access control for admin-only routes', async () => {
    // Only owners/admins may create targets; a plain member (via API key, fixed role) cannot.
    const tokenOwner = await registerAndLogin('Tenant RBAC', 'rbac-owner@test.com');

    const apiKeyResponse = await ctx.app.inject({
      method: 'POST',
      url: '/api/api-keys',
      headers: { authorization: `Bearer ${tokenOwner}` },
      payload: { name: 'ci-key' },
    });
    expect(apiKeyResponse.statusCode).toBe(201);
    const plainTextKey = apiKeyResponse.json<ApiKeyResponse>().plainTextKey;

    const forbidden = await ctx.app.inject({
      method: 'POST',
      url: '/api/targets',
      headers: { 'x-api-key': plainTextKey },
      payload: {
        name: 'Should be forbidden',
        type: 'http',
        config: { url: 'https://example.com' },
        intervalSeconds: 60,
        timeoutMs: 5000,
      },
    });
    expect(forbidden.statusCode).toBe(403);
  });
});

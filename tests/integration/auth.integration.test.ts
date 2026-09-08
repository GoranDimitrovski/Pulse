import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { setupTestApp } from './setup.js';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthUser {
  role: string;
}

describe('Auth flow (integration)', () => {
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

  it('registers a tenant, logs in, refreshes, and accesses a protected route', async () => {
    const register = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { tenantName: 'Acme Inc', email: 'owner@acme.test', password: 'password123' },
    });
    expect(register.statusCode).toBe(201);

    const login = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'owner@acme.test', password: 'password123' },
    });
    expect(login.statusCode).toBe(200);
    const { accessToken, refreshToken } = login.json<AuthTokens>();

    const me = await ctx.app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json<AuthUser>().role).toBe('owner');

    const refresh = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: { refreshToken },
    });
    expect(refresh.statusCode).toBe(200);
    expect(refresh.json<AuthTokens>().refreshToken).not.toBe(refreshToken);

    // the rotated-out refresh token must now be rejected
    const reuse = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: { refreshToken },
    });
    expect(reuse.statusCode).toBe(401);
  });

  it('rejects protected routes without a token', async () => {
    const response = await ctx.app.inject({ method: 'GET', url: '/api/auth/me' });
    expect(response.statusCode).toBe(401);
  });

  it('rejects a duplicate registration email with 409', async () => {
    await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { tenantName: 'Acme', email: 'dup@test.com', password: 'password123' },
    });

    const second = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { tenantName: 'Other', email: 'dup@test.com', password: 'password123' },
    });
    expect(second.statusCode).toBe(409);
  });

  it('rejects invalid login credentials with 401', async () => {
    await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { tenantName: 'Acme', email: 'user@test.com', password: 'password123' },
    });

    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'user@test.com', password: 'wrong-password' },
    });
    expect(response.statusCode).toBe(401);
  });
});

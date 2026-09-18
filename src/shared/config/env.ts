import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.string().default('info'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  CHECK_CONCURRENCY: z.coerce.number().int().positive().default(10),
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: z.coerce.number().int().positive().default(5),
  CIRCUIT_BREAKER_RESET_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  /**
   * Which upstream addresses may set X-Forwarded-For: a comma-separated list of IPs/CIDRs,
   * or a proxy-addr preset like 'loopback'. Rate limiting is keyed on the client IP, so
   * trusting the header unconditionally lets anyone mint a fresh bucket per request just by
   * sending one. Empty (the default) ignores the header and uses the socket address.
   */
  TRUST_PROXY: z.string().default(''),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid environment configuration:\n${issues.join('\n')}`);
  }
  return result.data;
}

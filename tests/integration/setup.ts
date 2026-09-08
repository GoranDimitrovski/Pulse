import { sql } from 'drizzle-orm';

import { loadEnv } from '../../src/shared/config/env.js';
import { createDatabase } from '../../src/infrastructure/database/client.js';
import { createContainer } from '../../src/infrastructure/composition/container.js';
import { buildApp } from '../../src/infrastructure/http/app.js';
import { createLogger } from '../../src/infrastructure/logging/logger.js';

export async function setupTestApp() {
  const env = loadEnv({ ...process.env, LOG_LEVEL: 'silent' });
  const logger = createLogger(env);
  const { db, close } = createDatabase(env.DATABASE_URL);
  const container = createContainer(env, db, logger);
  const app = await buildApp(container, logger);
  await app.ready();

  return {
    app,
    container,
    async truncateAll(): Promise<void> {
      await db.execute(sql`
        TRUNCATE TABLE
          check_results, targets, alert_channels, api_keys,
          password_reset_tokens, refresh_tokens, users, tenants
        CASCADE
      `);
    },
    async teardown(): Promise<void> {
      container.checkScheduler.stop();
      await app.close();
      await close();
    },
  };
}

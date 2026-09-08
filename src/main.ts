import 'dotenv/config';

import { loadEnv } from './shared/config/env.js';
import { createLogger } from './infrastructure/logging/logger.js';
import { createDatabase } from './infrastructure/database/client.js';
import { createContainer } from './infrastructure/composition/container.js';
import { buildApp } from './infrastructure/http/app.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env);
  const { db, close: closeDb } = createDatabase(env.DATABASE_URL);
  const container = createContainer(env, db, logger);

  container.dashboardGateway.start();
  container.alertDispatcher.start();
  container.checkScheduler.start();

  const app = await buildApp(container, logger);
  await app.listen({ host: env.HOST, port: env.PORT });
  logger.info({ host: env.HOST, port: env.PORT }, 'Pulse server listening');

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down gracefully');

    container.checkScheduler.stop();
    container.alertDispatcher.stop();
    container.dashboardGateway.stop();
    container.connectionManager.closeAll();

    await app.close();
    await closeDb();

    logger.info('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((error: unknown) => {
  console.error('Fatal error during startup', error);
  process.exitCode = 1;
});

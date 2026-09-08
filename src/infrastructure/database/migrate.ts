import { migrate } from 'drizzle-orm/postgres-js/migrator';
import 'dotenv/config';

import { createDatabase } from './client.js';
import { loadEnv } from '../../shared/config/env.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const { db, close } = createDatabase(env.DATABASE_URL);
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations applied successfully');
  } finally {
    await close();
  }
}

main().catch((error: unknown) => {
  console.error('Migration failed', error);
  process.exitCode = 1;
});

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema.js';

export type Database = ReturnType<typeof drizzle<typeof schema>>;

export function createDatabase(connectionString: string): {
  db: Database;
  close: () => Promise<void>;
} {
  const client = postgres(connectionString, { max: 10 });
  const db = drizzle(client, { schema });
  return { db, close: () => client.end() };
}

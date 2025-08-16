import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Neon driver types can vary across versions; cast to any for compatibility in SSR/build.
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql as any, { schema });
export type DB = typeof db;

export default db;

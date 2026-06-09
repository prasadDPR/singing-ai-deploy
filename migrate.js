import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

async function runMigrations() {
  console.log('Starting migrations...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  const client = await pool.connect();
  
  try {
    // Run base migration files
    const files = [
      '0000_new_black_widow.sql',
      'simple_migration.sql'
    ];

    for (const file of files) {
      try {
        const sql = readFileSync(join(__dirname, 'migrations', file), 'utf8');
        await client.query(sql);
        console.log(`Applied: ${file}`);
      } catch (err) {
        if (err.code === '42P07' || err.code === '42710') {
          console.log(`Skip: ${file} - already exists`);
        } else {
          console.log(`Error in ${file}: ${err.message}`);
        }
      }
    }

    // Add missing columns manually
    const alterations = [
      // Add target_metrics column to exercises
      `ALTER TABLE exercises ADD COLUMN IF NOT EXISTS target_metrics jsonb DEFAULT '[]'`,
      // Add completed_at column to exercise_progress
      `ALTER TABLE exercise_progress ADD COLUMN IF NOT EXISTS completed_at timestamp`,
      // Add learning_path column to users
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS learning_path text`,
      // Add any other missing columns
      `ALTER TABLE exercises ADD COLUMN IF NOT EXISTS instructions text`,
      `ALTER TABLE exercises ADD COLUMN IF NOT EXISTS duration integer DEFAULT 0`,
      `ALTER TABLE exercises ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'beginner'`,
      `ALTER TABLE exercises ADD COLUMN IF NOT EXISTS category text`,
      `ALTER TABLE exercises ADD COLUMN IF NOT EXISTS phase integer DEFAULT 1`,
    ];

    for (const sql of alterations) {
      try {
        await client.query(sql);
        console.log(`Applied: ${sql.substring(0, 50)}...`);
      } catch (err) {
        console.log(`Skip alteration: ${err.message}`);
      }
    }

    console.log('MIGRATION_DONE');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(console.error);
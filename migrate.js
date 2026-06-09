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
    const files = [
      '0000_new_black_widow.sql',
      '0001_organic_george_stacy.sql',
      '001_learning_paths.sql',
      'simple_migration.sql'
    ];

    for (const file of files) {
      try {
        const sql = readFileSync(join(__dirname, 'migrations', file), 'utf8');
        await client.query(sql);
        console.log(`Applied: ${file}`);
      } catch (err) {
        if (err.code === '42P07') {
          console.log(`Skip: ${file} - already exists`);
        } else {
          console.log(`Error: ${file} - ${err.message}`);
        }
      }
    }
    console.log('MIGRATION_DONE');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(console.error);
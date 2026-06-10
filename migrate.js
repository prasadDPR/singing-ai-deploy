import pg from 'pg';
import { dirname } from 'path';
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

    // ── Enable UUID extension ──────────────────────────────────────────────
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    console.log('Extension: pgcrypto ready');

    // ── USERS ──────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        google_id TEXT UNIQUE,
        experience_level TEXT NOT NULL DEFAULT 'beginner',
        vocal_range TEXT,
        learning_path TEXT,
        current_phase INTEGER NOT NULL DEFAULT 1,
        total_practice_minutes INTEGER NOT NULL DEFAULT 0,
        streak INTEGER NOT NULL DEFAULT 0,
        last_practice_date TIMESTAMP,
        bootcamp_start_date TIMESTAMP,
        weekly_goal_minutes INTEGER NOT NULL DEFAULT 60,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        password TEXT
      )
    `);
    console.log('Table: users ready');

    // Add any missing columns to users
    const userColumns = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_level TEXT NOT NULL DEFAULT 'beginner'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS vocal_range TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS learning_path TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS current_phase INTEGER NOT NULL DEFAULT 1`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_practice_minutes INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_practice_date TIMESTAMP`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS bootcamp_start_date TIMESTAMP`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_goal_minutes INTEGER NOT NULL DEFAULT 60`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW()`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT`,
    ];
    for (const sql of userColumns) {
      try { await client.query(sql); } catch(e) { /* column exists */ }
    }
    console.log('Table: users columns verified');

    // ── EXERCISES ──────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS exercises (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        phase INTEGER NOT NULL DEFAULT 1,
        category TEXT NOT NULL DEFAULT 'general',
        difficulty TEXT NOT NULL DEFAULT 'beginner',
        duration_minutes INTEGER NOT NULL DEFAULT 0,
        instructions TEXT NOT NULL DEFAULT '',
        target_metrics JSONB DEFAULT '[]'
      )
    `);
    console.log('Table: exercises ready');

    const exerciseColumns = [
      `ALTER TABLE exercises ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE exercises ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE exercises ADD COLUMN IF NOT EXISTS phase INTEGER NOT NULL DEFAULT 1`,
      `ALTER TABLE exercises ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general'`,
      `ALTER TABLE exercises ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'beginner'`,
      `ALTER TABLE exercises ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE exercises ADD COLUMN IF NOT EXISTS instructions TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE exercises ADD COLUMN IF NOT EXISTS target_metrics JSONB DEFAULT '[]'`,
    ];
    for (const sql of exerciseColumns) {
      try { await client.query(sql); } catch(e) { /* column exists */ }
    }
    console.log('Table: exercises columns verified');

    // ── EXERCISE PROGRESS ──────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS exercise_progress (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        exercise_id VARCHAR NOT NULL REFERENCES exercises(id),
        completed BOOLEAN NOT NULL DEFAULT false,
        pitch_score REAL,
        tone_score REAL,
        breathing_score REAL,
        overall_score REAL,
        completed_at TIMESTAMP,
        feedback TEXT,
        generative_feedback TEXT
      )
    `);
    console.log('Table: exercise_progress ready');

    const progressColumns = [
      `ALTER TABLE exercise_progress ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE exercise_progress ADD COLUMN IF NOT EXISTS pitch_score REAL`,
      `ALTER TABLE exercise_progress ADD COLUMN IF NOT EXISTS tone_score REAL`,
      `ALTER TABLE exercise_progress ADD COLUMN IF NOT EXISTS breathing_score REAL`,
      `ALTER TABLE exercise_progress ADD COLUMN IF NOT EXISTS overall_score REAL`,
      `ALTER TABLE exercise_progress ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP`,
      `ALTER TABLE exercise_progress ADD COLUMN IF NOT EXISTS feedback TEXT`,
      `ALTER TABLE exercise_progress ADD COLUMN IF NOT EXISTS generative_feedback TEXT`,
    ];
    for (const sql of progressColumns) {
      try { await client.query(sql); } catch(e) { /* column exists */ }
    }
    console.log('Table: exercise_progress columns verified');

    // ── VOICE ANALYSIS ─────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS voice_analysis (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        exercise_id VARCHAR,
        audio_url TEXT,
        pitch_accuracy REAL NOT NULL DEFAULT 0,
        tone_stability REAL NOT NULL DEFAULT 0,
        breathing_consistency REAL NOT NULL DEFAULT 0,
        overall_rating REAL NOT NULL DEFAULT 0,
        suggestions JSONB NOT NULL DEFAULT '[]',
        generative_feedback TEXT,
        analyzed_at TEXT NOT NULL DEFAULT ''
      )
    `);
    console.log('Table: voice_analysis ready');

    const voiceColumns = [
      `ALTER TABLE voice_analysis ADD COLUMN IF NOT EXISTS exercise_id VARCHAR`,
      `ALTER TABLE voice_analysis ADD COLUMN IF NOT EXISTS audio_url TEXT`,
      `ALTER TABLE voice_analysis ADD COLUMN IF NOT EXISTS pitch_accuracy REAL NOT NULL DEFAULT 0`,
      `ALTER TABLE voice_analysis ADD COLUMN IF NOT EXISTS tone_stability REAL NOT NULL DEFAULT 0`,
      `ALTER TABLE voice_analysis ADD COLUMN IF NOT EXISTS breathing_consistency REAL NOT NULL DEFAULT 0`,
      `ALTER TABLE voice_analysis ADD COLUMN IF NOT EXISTS overall_rating REAL NOT NULL DEFAULT 0`,
      `ALTER TABLE voice_analysis ADD COLUMN IF NOT EXISTS suggestions JSONB NOT NULL DEFAULT '[]'`,
      `ALTER TABLE voice_analysis ADD COLUMN IF NOT EXISTS generative_feedback TEXT`,
      `ALTER TABLE voice_analysis ADD COLUMN IF NOT EXISTS analyzed_at TEXT NOT NULL DEFAULT ''`,
    ];
    for (const sql of voiceColumns) {
      try { await client.query(sql); } catch(e) { /* column exists */ }
    }
    console.log('Table: voice_analysis columns verified');

    // ── SONGS ──────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS songs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        artist TEXT NOT NULL DEFAULT '',
        genre TEXT NOT NULL DEFAULT '',
        difficulty TEXT NOT NULL DEFAULT 'beginner',
        vocal_range TEXT NOT NULL DEFAULT '',
        bpm INTEGER NOT NULL DEFAULT 120,
        key TEXT NOT NULL DEFAULT 'C',
        lyrics TEXT,
        lyrics_timestamps JSONB,
        audio_url TEXT,
        phase INTEGER
      )
    `);
    console.log('Table: songs ready');

    const songColumns = [
      `ALTER TABLE songs ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE songs ADD COLUMN IF NOT EXISTS artist TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE songs ADD COLUMN IF NOT EXISTS genre TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE songs ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'beginner'`,
      `ALTER TABLE songs ADD COLUMN IF NOT EXISTS vocal_range TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE songs ADD COLUMN IF NOT EXISTS bpm INTEGER NOT NULL DEFAULT 120`,
      `ALTER TABLE songs ADD COLUMN IF NOT EXISTS key TEXT NOT NULL DEFAULT 'C'`,
      `ALTER TABLE songs ADD COLUMN IF NOT EXISTS lyrics TEXT`,
      `ALTER TABLE songs ADD COLUMN IF NOT EXISTS lyrics_timestamps JSONB`,
      `ALTER TABLE songs ADD COLUMN IF NOT EXISTS audio_url TEXT`,
      `ALTER TABLE songs ADD COLUMN IF NOT EXISTS phase INTEGER`,
    ];
    for (const sql of songColumns) {
      try { await client.query(sql); } catch(e) { /* column exists */ }
    }
    console.log('Table: songs columns verified');

    // ── PRACTICE ROUTINES ──────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS practice_routines (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        exercise_ids JSONB NOT NULL DEFAULT '[]',
        goal_minutes INTEGER NOT NULL DEFAULT 30,
        completed_minutes INTEGER NOT NULL DEFAULT 0
      )
    `);
    console.log('Table: practice_routines ready');

    // ── PERFORMANCES ───────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS performances (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        song_id VARCHAR REFERENCES songs(id),
        audience_reactions JSONB,
        performance_score REAL,
        stage_effects JSONB,
        performed_at TEXT NOT NULL DEFAULT ''
      )
    `);
    console.log('Table: performances ready');

    // ── Add unique constraints if missing ──────────────────────────────────
    try {
      await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email) WHERE email IS NOT NULL`);
      await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_unique ON users(google_id) WHERE google_id IS NOT NULL`);
    } catch(e) { /* index exists */ }

    console.log('MIGRATION_DONE - All tables and columns verified');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(console.error);

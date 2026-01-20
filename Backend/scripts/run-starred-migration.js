import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool } from '../src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runStarredMigration() {
  try {
    console.log('🌟 Running migration: 004_add_starred_column.sql');
    console.log('Adding is_starred columns to files and folders tables...\n');
    
    const migrationPath = join(__dirname, '../migrations/004_add_starred_column.sql');
    const sql = readFileSync(migrationPath, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ is_starred columns added to files and folders tables');
    console.log('✅ Indexes created for better performance');
    console.log('\n🎉 Star functionality is now available!');
    console.log('   - You can now star/unstar files and folders');
    console.log('   - Starred items will appear in the "Starred" section');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n💡 Alternative: Run the SQL directly in Supabase Dashboard:');
    console.error('   1. Go to https://supabase.com/dashboard');
    console.error('   2. Select your project → SQL Editor');
    console.error('   3. Copy the SQL from: Backend/migrations/004_add_starred_column.sql');
    console.error('   4. Paste and run it');
    process.exit(1);
  }
}

runStarredMigration();

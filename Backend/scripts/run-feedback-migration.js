import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool } from '../src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runFeedbackMigration() {
  try {
    console.log('📝 Running migration: 005_create_feedback_table.sql');
    console.log('Creating feedback table...\n');
    
    const migrationPath = join(__dirname, '../migrations/005_create_feedback_table.sql');
    const sql = readFileSync(migrationPath, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ Feedback table created');
    console.log('✅ RLS policies configured');
    console.log('\n🎉 Feedback functionality is now available!');
    console.log('   - Users can now submit feedback');
    console.log('   - Users can view their feedback history');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n💡 Alternative: Run the SQL directly in Supabase Dashboard:');
    console.error('   1. Go to https://supabase.com/dashboard');
    console.error('   2. Select your project → SQL Editor');
    console.error('   3. Copy the SQL from: Backend/migrations/005_create_feedback_table.sql');
    console.error('   4. Paste and run it');
    process.exit(1);
  }
}

runFeedbackMigration();

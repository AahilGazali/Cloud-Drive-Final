// Test route to verify database connection and RLS bypass
import express from 'express';
import { query } from '../config/db.js';

const router = express.Router();

router.post('/test-db-insert', async (req, res) => {
  try {
    console.log('🧪 Testing direct PostgreSQL insert (bypasses RLS)...');
    
    const testUserId = req.body.userId || '00000000-0000-0000-0000-000000000000';
    
    // Test inserting into files table
    const insertQuery = `
      INSERT INTO public.files (name, path, size, mime_type, user_id, folder_id, is_deleted)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, user_id
    `;
    
    const { rows } = await query(insertQuery, [
      'TEST_FILE_DELETE_ME.txt',
      'test/path.txt',
      100,
      'text/plain',
      testUserId,
      null,
      false
    ]);
    
    console.log('✅ Test insert successful!', rows[0]);
    
    // Clean up - delete the test file
    await query('DELETE FROM public.files WHERE id = $1', [rows[0].id]);
    console.log('✅ Test file deleted');
    
    return res.json({
      success: true,
      message: 'Direct PostgreSQL insert works! RLS is bypassed.',
      inserted: rows[0],
      note: 'This test file was automatically deleted'
    });
    
  } catch (error) {
    console.error('❌ Test insert failed:', error.message);
    
    if (error.message && error.message.includes('row-level security')) {
      return res.status(500).json({
        success: false,
        error: 'RLS error - The postgres role bypass policy is missing!',
        message: 'Run the SQL in Backend/FIX_RLS_IN_SUPABASE.sql in Supabase SQL Editor',
        details: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Database error',
      message: error.message
    });
  }
});

export default router;

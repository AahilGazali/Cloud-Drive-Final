import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

if (!env.SUPABASE_DB_URL) {
  console.error("❌ SUPABASE_DB_URL not set. Database queries will fail.");
  console.error("Please set SUPABASE_DB_URL in your .env file.");
}

export const pool = new Pool({
  connectionString: env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false,
    require: true,
  },
  // Connection settings
  connectionTimeoutMillis: 30000, // 30 seconds (increased for reliability)
  idleTimeoutMillis: 30000,
  max: 10, // Reduced pool size for stability
  // Keep connections alive
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  // Support both direct and pooler connections
  // Pooler uses port 6543, direct uses 5432
  // IMPORTANT: Use Session Pooler (port 6543) for better reliability
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

// Test connection on startup
if (env.SUPABASE_DB_URL) {
  pool.query('SELECT NOW()')
    .then(() => {
      console.log('✅ Database connection successful');
      console.log('✅ Direct PostgreSQL queries will bypass RLS for all users');
    })
    .catch((err) => {
      console.error('❌ Database connection failed:', err.message);
      
      if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
        console.error('   This usually means:');
        console.error('   1. The SUPABASE_DB_URL is incorrect');
        console.error('   2. Your network cannot reach the database');
        console.error('   3. The database hostname is invalid');
        console.error('   SOLUTION: Use Session Pooler connection string (see FIX_CONNECTION_ERROR.md)');
      } else if (err.message.includes('password authentication failed') || err.message.includes('authentication failed')) {
        console.error('   This means:');
        console.error('   1. The password in SUPABASE_DB_URL is incorrect');
        console.error('   2. Go to Supabase Dashboard → Settings → Database');
        console.error('   3. Click "Database Settings" to reset your password');
        console.error('   4. Update SUPABASE_DB_URL in Backend/.env with the correct password');
      } else if (err.message.includes('connection terminated') || err.message.includes('ECONNRESET') || err.message.includes('socket hang up')) {
        console.error('   Connection terminated unexpectedly!');
        console.error('   This usually means:');
        console.error('   1. You are using Direct connection (not Session Pooler)');
        console.error('   2. Your network has connectivity issues');
        console.error('   3. The connection string format is incorrect');
        console.error('');
        console.error('   SOLUTION: Use Session Pooler connection string');
        console.error('   1. Go to Supabase Dashboard → Settings → Database');
        console.error('   2. Click "Connection String" tab');
        console.error('   3. Change "Method" to "Session pooler"');
        console.error('   4. Copy the connection string');
        console.error('   5. Update SUPABASE_DB_URL in Backend/.env');
        console.error('   6. Restart backend');
        console.error('   See FIX_CONNECTION_ERROR.md for detailed steps');
      }
    });
} else {
  console.error('❌ CRITICAL: SUPABASE_DB_URL is not set!');
  console.error('   File and folder uploads will fail without this.');
  console.error('   Add SUPABASE_DB_URL to Backend/.env file.');
}

/**
 * Execute a query with a clean connection context
 * This ensures RLS policies work correctly regardless of previous session state
 * Each query gets a fresh connection from the pool to avoid session state pollution
 */
export const query = async (text, params) => {
  let client;
  let retries = 0;
  const maxRetries = 2;
  
  while (retries <= maxRetries) {
    try {
      client = await pool.connect();
      
      // Execute the query directly
      // RLS policies (once fixed with RUN_THIS_SQL_IN_SUPABASE.sql) will allow the operation
      const result = await client.query(text, params);
      
      // Success - release client and return
      client.release();
      return result;
    } catch (error) {
      // Release client if we got one
      if (client) {
        try {
          client.release();
        } catch (releaseError) {
          // Ignore release errors
        }
      }
      
      // Check if it's a connection error that might be retryable
      const isConnectionError = error.message && (
        error.message.includes('connection terminated') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('socket hang up') ||
        error.message.includes('Connection closed')
      );
      
      // Retry connection errors up to maxRetries
      if (isConnectionError && retries < maxRetries) {
        retries++;
        console.warn(`⚠️ Connection error, retrying (${retries}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Wait before retry
        continue;
      }
      
      // Enhance error messages for common connection issues
      if (error.message && (
        error.message.includes('ENOTFOUND') || 
        error.message.includes('ECONNREFUSED') || 
        error.message.includes('getaddrinfo')
      )) {
        const enhancedError = new Error(`Database connection failed: ${error.message}`);
        enhancedError.originalError = error;
        enhancedError.code = error.code;
        throw enhancedError;
      }
      
      // If connection terminated, provide helpful message
      if (error.message && (
        error.message.includes('connection terminated') ||
        error.message.includes('ECONNRESET')
      )) {
        throw new Error('Database connection terminated. Please use Session Pooler connection string (see FIX_CONNECTION_ERROR.md)');
      }
      
      throw error;
    }
  }
  
  // Should never reach here, but just in case
  throw new Error('Database connection failed after retries');
};


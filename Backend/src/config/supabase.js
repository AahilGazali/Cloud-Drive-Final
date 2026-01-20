import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// Create Supabase client with service role key
// Service role key bypasses RLS (Row Level Security)
if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in environment variables!");
  console.error("Please check your .env file in the Backend directory.");
}

// Ensure service role key is used (bypasses RLS)
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error("❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set!");
  console.error("The backend requires the service_role key (not anon key) to bypass RLS.");
  console.error("Get it from: Supabase Dashboard → Settings → API → service_role key");
}

export const supabase = createClient(
  env.SUPABASE_URL,
  serviceRoleKey || '', // Empty string will cause errors but prevents undefined issues
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'cloud-drive-backend',
      },
    },
  }
);

// Verify service role key is being used (for debugging)
if (env.SUPABASE_SERVICE_ROLE_KEY) {
  const keyPrefix = env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20);
  if (!keyPrefix.includes('eyJ') && env.SUPABASE_SERVICE_ROLE_KEY.length < 100) {
    console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY might be incorrect. Service role keys are typically long JWT tokens.");
  }
}

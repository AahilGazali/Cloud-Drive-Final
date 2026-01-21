-- ============================================
-- FIX RLS ERROR FOR FILE UPLOADS
-- This SQL fixes the "new row violates row-level security policy" error
-- Copy and paste this ENTIRE file into Supabase SQL Editor and run it
-- ============================================

-- ============================================
-- FILES TABLE RLS FIX
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.files ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Service role bypass" ON public.files;
DROP POLICY IF EXISTS "Service role can do everything" ON public.files;
DROP POLICY IF EXISTS "Users can insert their own files" ON public.files;
DROP POLICY IF EXISTS "Users can view their own files" ON public.files;
DROP POLICY IF EXISTS "Users can update their own files" ON public.files;
DROP POLICY IF EXISTS "Users can delete their own files" ON public.files;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.files;
DROP POLICY IF EXISTS "Enable all for service role" ON public.files;

-- CRITICAL: Create policy that allows service_role to bypass RLS completely
-- This is the most important policy - it allows the backend to insert files
CREATE POLICY "Service role bypass"
ON public.files
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Also create policies for authenticated users (for direct client access if needed)
CREATE POLICY "Users can insert their own files"
ON public.files
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own files"
ON public.files
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own files"
ON public.files
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own files"
ON public.files
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id::text);

-- ============================================
-- FOLDERS TABLE RLS FIX
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.folders ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Service role bypass folders" ON public.folders;
DROP POLICY IF EXISTS "Service role can do everything folders" ON public.folders;
DROP POLICY IF EXISTS "Users can insert their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can view their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON public.folders;

-- CRITICAL: Allow service_role to bypass RLS for folders
CREATE POLICY "Service role bypass folders"
ON public.folders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policies for authenticated users
CREATE POLICY "Users can insert their own folders"
ON public.folders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own folders"
ON public.folders
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own folders"
ON public.folders
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own folders"
ON public.folders
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id::text);

-- ============================================
-- FEEDBACK TABLE RLS FIX (if table exists)
-- ============================================

-- Only run if feedback table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feedback') THEN
    -- Ensure RLS is enabled
    ALTER TABLE IF EXISTS public.feedback ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing service role policy if it exists
    DROP POLICY IF EXISTS "Service role bypass feedback" ON public.feedback;
    
    -- Allow service role to bypass RLS for feedback
    CREATE POLICY "Service role bypass feedback"
    ON public.feedback
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify policies were created successfully
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('files', 'folders', 'feedback')
ORDER BY tablename, policyname;

-- ============================================
-- NOTES
-- ============================================
-- After running this SQL:
-- 1. Make sure your Backend/.env has SUPABASE_SERVICE_ROLE_KEY set correctly
-- 2. The service_role key should be from: Supabase Dashboard → Settings → API → service_role key
-- 3. Restart your backend server after applying these changes
-- 4. Try uploading a file again - it should work now!

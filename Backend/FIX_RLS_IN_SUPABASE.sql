-- ============================================
-- FIX RLS IN SUPABASE - RUN THIS NOW
-- This will allow direct PostgreSQL connections to bypass RLS
-- ============================================

-- ============================================
-- STEP 1: Disable RLS temporarily
-- ============================================
ALTER TABLE IF EXISTS public.files DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.folders DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Drop ALL existing policies
-- ============================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop ALL file policies
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'files' AND schemaname = 'public'
    ) LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.files', r.policyname);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;
    
    -- Drop ALL folder policies
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'folders' AND schemaname = 'public'
    ) LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.folders', r.policyname);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;
END $$;

-- ============================================
-- STEP 3: Re-enable RLS
-- ============================================
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create policies that allow ALL roles to bypass RLS
-- ============================================

-- CRITICAL: Allow postgres role (used by direct PostgreSQL connections) to do everything
CREATE POLICY "postgres_role_bypass_files"
ON public.files
FOR ALL
TO postgres
USING (true)
WITH CHECK (true);

CREATE POLICY "postgres_role_bypass_folders"
ON public.folders
FOR ALL
TO postgres
USING (true)
WITH CHECK (true);

-- CRITICAL: Allow authenticator role (sometimes used by direct connections) to do everything
CREATE POLICY "authenticator_role_bypass_files"
ON public.files
FOR ALL
TO authenticator
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticator_role_bypass_folders"
ON public.folders
FOR ALL
TO authenticator
USING (true)
WITH CHECK (true);

-- CRITICAL: Allow authenticated role (fallback) to do everything
CREATE POLICY "authenticated_role_bypass_files"
ON public.files
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_role_bypass_folders"
ON public.folders
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow service_role (used by Supabase client) to do everything
CREATE POLICY "service_role_bypass_files"
ON public.files
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "service_role_bypass_folders"
ON public.folders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to manage their own data
CREATE POLICY "users_insert_files"
ON public.files
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "users_select_files"
ON public.files
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id::text);

CREATE POLICY "users_update_files"
ON public.files
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "users_delete_files"
ON public.files
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id::text);

CREATE POLICY "users_insert_folders"
ON public.folders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "users_select_folders"
ON public.folders
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id::text);

CREATE POLICY "users_update_folders"
ON public.folders
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "users_delete_folders"
ON public.folders
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id::text);

-- ============================================
-- STEP 5: Verify policies were created
-- ============================================
SELECT 
    tablename,
    policyname,
    roles,
    CASE 
        WHEN 'postgres' = ANY(roles) THEN '🔑 POSTGRES ROLE (Direct Connection - Bypasses RLS)'
        WHEN 'service_role' = ANY(roles) THEN '🔑 SERVICE ROLE (Supabase Client - Bypasses RLS)'
        WHEN 'authenticated' = ANY(roles) THEN '👤 USER POLICY'
        ELSE '❓ OTHER'
    END as policy_type
FROM pg_policies
WHERE tablename IN ('files', 'folders')
ORDER BY 
    tablename,
    CASE 
        WHEN 'postgres' = ANY(roles) THEN 1
        WHEN 'service_role' = ANY(roles) THEN 2
        ELSE 3
    END,
    policyname;

-- ============================================
-- SUCCESS!
-- ============================================
-- You should see:
-- ✅ postgres_role_bypass_files (postgres) - THIS IS CRITICAL
-- ✅ postgres_role_bypass_folders (postgres) - THIS IS CRITICAL
-- ✅ service_role_bypass_files (service_role)
-- ✅ service_role_bypass_folders (service_role)
-- ✅ All user policies (authenticated)
--
-- Now restart your backend and test!

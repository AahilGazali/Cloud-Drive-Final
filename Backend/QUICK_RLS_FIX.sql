-- ============================================
-- QUICK FIX FOR RLS ERROR
-- Copy and paste this into Supabase SQL Editor
-- ============================================

-- Fix Files Table RLS
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Service role bypass" ON public.files;
DROP POLICY IF EXISTS "Users can insert their own files" ON public.files;
DROP POLICY IF EXISTS "Users can view their own files" ON public.files;
DROP POLICY IF EXISTS "Users can update their own files" ON public.files;
DROP POLICY IF EXISTS "Users can delete their own files" ON public.files;

-- CRITICAL: Allow service role to bypass RLS (this fixes uploads)
CREATE POLICY "Service role bypass"
ON public.files
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Fix Folders Table RLS
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role bypass folders" ON public.folders;
DROP POLICY IF EXISTS "Users can insert their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can view their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON public.folders;

CREATE POLICY "Service role bypass folders"
ON public.folders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

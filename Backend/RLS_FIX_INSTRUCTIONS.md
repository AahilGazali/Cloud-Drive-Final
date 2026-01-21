# Fix Row Level Security (RLS) Error for File Uploads

## Problem
Error: "new row violates row-level security policy"

This error occurs when Supabase RLS (Row Level Security) is blocking file uploads. This happens when:
1. RLS is enabled on the `files` table but no policy allows the service role to insert
2. The service role key is not configured correctly in your backend environment

## Quick Fix (Recommended)

### For Deployed Sites (Netlify, Vercel, etc.)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click **"SQL Editor"** in the left sidebar

2. **Run the Fix SQL**
   - Open the file `Backend/FIX_RLS_UPLOAD_ERROR.sql` in this repository
   - Copy the **ENTIRE** contents
   - Paste into Supabase SQL Editor
   - Click **"Run"** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

3. **Verify the Fix**
   - You should see a success message
   - The verification query at the end will show all created policies
   - Try uploading a file on your deployed site - it should work now!

### Step 1: Verify Service Role Key is Set (For Backend Environment)

1. Open your Supabase Dashboard
2. Go to **Settings** → **API**
3. Copy the **service_role** key (NOT the anon key)
4. Make sure it's set in your deployment environment variables:
   - **Netlify**: Site settings → Environment variables
   - **Vercel**: Project settings → Environment variables
   - **Other**: Check your hosting platform's environment variable settings

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important**: The service_role key should be a long JWT token (starts with `eyJ`). It's different from the anon key.

### Step 2: Run SQL to Fix RLS Policies

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `FIX_RLS_UPLOAD_ERROR.sql` (recommended) or `FIX_RLS_POLICIES.sql`
4. Click **Run**

This will:
- Create policies that allow service role to bypass RLS completely
- Create policies for authenticated users to manage their own files
- Fix both `files` and `folders` tables

### Step 3: Alternative - Disable RLS (Development Only)

If you're in development and want to quickly test, you can temporarily disable RLS:

```sql
ALTER TABLE public.files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders DISABLE ROW LEVEL SECURITY;
```

**⚠️ WARNING**: Only do this in development! Never disable RLS in production.

### Step 4: Restart Backend Server

After making changes, restart your backend server:

```bash
cd Backend
npm start
```

## Verification

After applying the fix, try uploading a file again. The upload should work without the RLS error.

## Still Having Issues?

1. Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly in `.env`
2. Verify the service role key in Supabase Dashboard matches your `.env` file
3. Check backend console logs for any Supabase connection errors
4. Ensure the `files` table exists and has the correct columns

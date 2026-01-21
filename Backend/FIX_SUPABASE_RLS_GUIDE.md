# 🔧 Fix RLS in Supabase - Step by Step Guide

## The Problem
Even though the code uses direct PostgreSQL queries, Supabase RLS policies might still be blocking them if the `postgres` role doesn't have bypass permissions.

## Solution: Run SQL in Supabase

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### Step 2: Copy and Paste the SQL
1. Open the file: `Backend/FIX_RLS_IN_SUPABASE.sql`
2. Copy **ALL** the SQL code (from `-- ============================================` to the end)
3. Paste it into the Supabase SQL Editor

### Step 3: Run the SQL
1. Click the **"Run"** button (or press `Ctrl+Enter`)
2. Wait for it to complete (should take 1-2 seconds)
3. You should see a success message and a table showing the policies

### Step 4: Verify It Worked
Look at the results table. You should see:
- ✅ `postgres_role_bypass_files` (postgres role)
- ✅ `postgres_role_bypass_folders` (postgres role)
- ✅ `service_role_bypass_files` (service_role)
- ✅ `service_role_bypass_folders` (service_role)
- ✅ All user policies

### Step 5: Restart Your Backend
```bash
# Stop backend (Ctrl+C)
cd Backend
npm run dev
```

### Step 6: Test
1. Register a new user
2. Login
3. Upload a file - **It should work now!**

## Why This Works

- **Direct PostgreSQL connections** (via `SUPABASE_DB_URL`) connect as the `postgres` role
- The new SQL creates policies that allow the `postgres` role to bypass RLS completely
- This works for **ALL users** because the backend uses direct PostgreSQL queries

## If It Still Doesn't Work

1. **Check backend console** - You should see:
   ```
   📁 [DIRECT POSTGRESQL] Inserting file record for user [userId] (bypasses RLS)
   ```
   If you don't see this, the backend wasn't restarted.

2. **Check Supabase** - Make sure the SQL ran successfully and you see the `postgres_role_bypass_*` policies in the results.

3. **Check `.env` file** - Make sure `SUPABASE_DB_URL` is set correctly.

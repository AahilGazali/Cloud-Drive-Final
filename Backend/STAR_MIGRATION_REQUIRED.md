# ⚠️ IMPORTANT: Database Migration Required for Star Functionality

## The Error You're Seeing
"Failed to toggle star: File not found" or similar errors when trying to star files/folders.

## The Solution
You need to add the `is_starred` column to your database tables. This is a **one-time setup**.

### Quick Fix (2 minutes):

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click **"SQL Editor"** in the left sidebar

2. **Copy and Paste This SQL:**
```sql
-- Add is_starred column to files table
ALTER TABLE public.files 
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE NOT NULL;

-- Add is_starred column to folders table
ALTER TABLE public.folders 
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE NOT NULL;

-- Create indexes for better performance on starred queries
CREATE INDEX IF NOT EXISTS idx_files_is_starred ON public.files(is_starred) WHERE is_starred = true;
CREATE INDEX IF NOT EXISTS idx_folders_is_starred ON public.folders(is_starred) WHERE is_starred = true;
CREATE INDEX IF NOT EXISTS idx_files_user_starred ON public.files(user_id, is_starred);
CREATE INDEX IF NOT EXISTS idx_folders_user_starred ON public.folders(user_id, is_starred);
```

3. **Click "Run"** button (or press Ctrl+Enter)

4. **Refresh Your App** - The star functionality will now work!

---

## After Running the Migration

✅ You can star/unstar files and folders  
✅ Starred items will appear in the "Starred" section  
✅ The star icon will show filled when an item is starred  

---

**Note:** The SQL file is also saved at: `Backend/migrations/004_add_starred_column.sql`

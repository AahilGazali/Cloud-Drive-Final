# ⚠️ IMPORTANT: Database Migration Required for Feedback Functionality

## The Error You're Seeing
"Could not find the table 'public.feedback' in the schema cache"

## The Solution
You need to create the `feedback` table in your database. This is a **one-time setup**.

### Quick Fix (2 minutes):

**Option 1: Run SQL directly in Supabase Dashboard (RECOMMENDED)**

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click **"SQL Editor"** in the left sidebar

2. **Copy and Paste This SQL:**
   ```sql
   -- Create feedback table
   CREATE TABLE IF NOT EXISTS public.feedback (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     user_email TEXT NOT NULL,
     feedback TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create index on user_id for faster queries
   CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);

   -- Create index on created_at for sorting
   CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

   -- Enable RLS
   ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

   -- RLS Policy: Users can only see their own feedback
   CREATE POLICY "Users can view their own feedback"
     ON public.feedback
     FOR SELECT
     USING (auth.uid() = user_id);

   -- RLS Policy: Users can insert their own feedback
   CREATE POLICY "Users can insert their own feedback"
     ON public.feedback
     FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   -- RLS Policy: Users can update their own feedback (optional, for future use)
   CREATE POLICY "Users can update their own feedback"
     ON public.feedback
     FOR UPDATE
     USING (auth.uid() = user_id)
     WITH CHECK (auth.uid() = user_id);

   -- RLS Policy: Users can delete their own feedback (optional, for future use)
   CREATE POLICY "Users can delete their own feedback"
     ON public.feedback
     FOR DELETE
     USING (auth.uid() = user_id);
   ```

3. **Click "Run"** button (or press Ctrl+Enter)

4. **Refresh Your App** - The feedback functionality will now work!

---

**Option 2: Run migration script**

```bash
cd Backend
npm run migrate-feedback
```

**Note:** Make sure your `.env` file has `SUPABASE_DB_URL` configured correctly.

---

## After Running the Migration

✅ Users can submit feedback via the "Send Feedback" modal  
✅ Users can view their feedback history on the Feedback page  
✅ All feedback is stored securely with RLS policies  

---

**Note:** The SQL file is also saved at: `Backend/migrations/005_create_feedback_table.sql`

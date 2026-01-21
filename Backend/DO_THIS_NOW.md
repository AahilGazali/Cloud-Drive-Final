# 🚨 DO THIS NOW - FIX THE ERROR

## The Error
"Upload failed. Please try again." on Netlify

## The Fix (2 Steps - Takes 3 minutes)

### ✅ Step 1: Run SQL in Supabase (REQUIRED)

1. **Go to Supabase**: https://supabase.com/dashboard
2. **Select your project**
3. **Click "SQL Editor"** → **"New query"**
4. **Open file**: `Backend/SIMPLE_RLS_FIX_FINAL.sql`
5. **Copy ALL** (Ctrl+A, Ctrl+C)
6. **Paste** into Supabase SQL Editor
7. **Click "Run"** button
8. **Wait** - you should see a results table with policies

### ✅ Step 2: Wait 2-3 Minutes

- Render/Railway needs time to deploy the new code
- The SQL fix takes effect immediately

### ✅ Step 3: Test

1. Go to: https://cloud-drive-aahil.netlify.app
2. Register a NEW user (or login)
3. Upload a file
4. **It should work!** ✅

## Why This Works

- The SQL allows **ALL database roles** to bypass RLS
- This works for **ALL users** (new and existing)
- Works on **both localhost and Netlify**

## If It Still Doesn't Work

1. **Check Supabase** - Did the SQL run successfully? Do you see policies in the results?
2. **Wait longer** - Sometimes takes 5 minutes for deployment
3. **Clear browser cache** - Press Ctrl+Shift+R
4. **Try incognito mode** - To rule out cache issues

---

**The SQL file is:** `Backend/SIMPLE_RLS_FIX_FINAL.sql`

**Just run it in Supabase and the error will be fixed!**

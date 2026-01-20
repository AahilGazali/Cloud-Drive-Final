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

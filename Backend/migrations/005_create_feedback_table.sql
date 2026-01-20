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

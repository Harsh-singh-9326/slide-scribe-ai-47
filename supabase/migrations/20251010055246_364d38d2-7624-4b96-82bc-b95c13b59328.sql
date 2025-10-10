-- Create analytics tables for presentation tracking
CREATE TABLE IF NOT EXISTS public.presentation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'download', 'edit')),
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.presentation_analytics ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own analytics"
  ON public.presentation_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
  ON public.presentation_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_presentation_analytics_presentation_id ON public.presentation_analytics(presentation_id);
CREATE INDEX idx_presentation_analytics_user_id ON public.presentation_analytics(user_id);
CREATE INDEX idx_presentation_analytics_event_type ON public.presentation_analytics(event_type);

-- Add view_count and download_count to presentations table
ALTER TABLE public.presentations 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
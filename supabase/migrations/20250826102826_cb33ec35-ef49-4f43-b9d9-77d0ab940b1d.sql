-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create presentations table
CREATE TABLE public.presentations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT DEFAULT 'modern',
  content JSONB DEFAULT '[]'::jsonb,
  slide_count INTEGER DEFAULT 0,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create slides table  
CREATE TABLE public.slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  notes TEXT,
  slide_order INTEGER NOT NULL,
  layout TEXT DEFAULT 'title-content',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for presentations
CREATE POLICY "Users can view their own presentations" 
ON public.presentations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own presentations" 
ON public.presentations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presentations" 
ON public.presentations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presentations" 
ON public.presentations FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for slides
CREATE POLICY "Users can view slides of their presentations" 
ON public.slides FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.presentations 
    WHERE presentations.id = slides.presentation_id 
    AND presentations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create slides for their presentations" 
ON public.slides FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.presentations 
    WHERE presentations.id = slides.presentation_id 
    AND presentations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update slides of their presentations" 
ON public.slides FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.presentations 
    WHERE presentations.id = slides.presentation_id 
    AND presentations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete slides of their presentations" 
ON public.slides FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.presentations 
    WHERE presentations.id = slides.presentation_id 
    AND presentations.user_id = auth.uid()
  )
);

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('presentations', 'presentations', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies for presentations bucket
CREATE POLICY "Users can view their own presentation files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'presentations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own presentation files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'presentations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own presentation files" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'presentations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own presentation files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'presentations' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for documents bucket
CREATE POLICY "Users can view their own documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_presentations_updated_at
  BEFORE UPDATE ON public.presentations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_slides_updated_at
  BEFORE UPDATE ON public.slides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
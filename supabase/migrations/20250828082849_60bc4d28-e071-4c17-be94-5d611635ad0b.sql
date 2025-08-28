-- Fix security warning: Function Search Path Mutable
DROP FUNCTION IF EXISTS public.request_password_reset(text);

CREATE OR REPLACE FUNCTION public.request_password_reset(email_address text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Check if user exists
  SELECT id INTO user_id 
  FROM auth.users 
  WHERE email = email_address;
  
  IF user_id IS NULL THEN
    -- Don't reveal if email exists or not for security
    RETURN json_build_object('success', true, 'message', 'If the email exists, a reset link has been sent');
  END IF;
  
  -- Return success message (in a real app, you'd send an actual email here)
  RETURN json_build_object('success', true, 'message', 'If the email exists, a reset link has been sent');
END;
$$;
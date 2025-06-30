-- Fix Allowed Emails Table Schema
-- The issue is that email and domain columns can't both be NOT NULL

-- 1. Drop the existing table if it exists (to fix schema)
DROP TABLE IF EXISTS public.allowed_emails CASCADE;

-- 2. Create the corrected allowed_emails table
CREATE TABLE public.allowed_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE, -- Can be NULL if it's a domain entry
  domain TEXT UNIQUE, -- Can be NULL if it's an email entry
  is_active BOOLEAN DEFAULT true,
  created_by UUID, -- Remove foreign key constraint for now
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure at least one of email or domain is provided
  CONSTRAINT email_or_domain_required CHECK (
    (email IS NOT NULL AND domain IS NULL) OR 
    (email IS NULL AND domain IS NOT NULL)
  )
);

-- 3. Enable RLS on allowed_emails table
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for allowed_emails table (admin only)
CREATE POLICY "Admins can view all allowed emails" ON public.allowed_emails
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage allowed emails" ON public.allowed_emails
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 5. Create function to check if email is allowed
CREATE OR REPLACE FUNCTION public.is_email_allowed(email_to_check TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  email_domain TEXT;
BEGIN
  -- If no restrictions are set (table is empty), allow all emails
  IF NOT EXISTS (SELECT 1 FROM public.allowed_emails WHERE is_active = true) THEN
    RETURN TRUE;
  END IF;
  
  -- Check for exact email match
  IF EXISTS (
    SELECT 1 FROM public.allowed_emails 
    WHERE email = email_to_check 
    AND is_active = true
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check for domain match
  email_domain := '@' || split_part(email_to_check, '@', 2);
  IF EXISTS (
    SELECT 1 FROM public.allowed_emails 
    WHERE domain = email_domain 
    AND is_active = true
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update the user creation trigger to check allowed emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if email is allowed (only if restrictions are in place)
  IF NOT public.is_email_allowed(NEW.email) THEN
    RAISE EXCEPTION 'Email address not authorized for registration: %', NEW.email;
  END IF;
  
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.allowed_emails TO authenticated;

-- 8. Add the requested email addresses to the allowed list
INSERT INTO public.allowed_emails (email) VALUES 
  ('jdpinetta@gmail.com'),
  ('bigstepidiomas@gmail.com'),
  ('naguipinetta@gmail.com'),
  ('jpinetta@descartes.com'),
  ('vtheimann@descartes.com'),
  ('jbruno@descartes.com');

-- 9. Also allow the @descartes.com domain for convenience
INSERT INTO public.allowed_emails (domain) VALUES 
  ('@descartes.com');

-- 10. Verify the setup
SELECT 'Allowed emails setup completed successfully!' as status;
SELECT 'Individual emails added:' as info, email FROM public.allowed_emails WHERE email IS NOT NULL;
SELECT 'Domains added:' as info, domain FROM public.allowed_emails WHERE domain IS NOT NULL; 
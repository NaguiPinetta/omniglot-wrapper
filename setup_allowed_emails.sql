-- Setup Allowed Emails Table and Add Specific Email Addresses
-- This restricts signup access to only the specified email addresses

-- 1. Create the allowed_emails table
CREATE TABLE IF NOT EXISTS public.allowed_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  domain TEXT, -- For domain-based restrictions (e.g., '@company.com')
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS on allowed_emails table
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for allowed_emails table (admin only)
DROP POLICY IF EXISTS "Admins can view all allowed emails" ON public.allowed_emails;
CREATE POLICY "Admins can view all allowed emails" ON public.allowed_emails
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage allowed emails" ON public.allowed_emails;
CREATE POLICY "Admins can manage allowed emails" ON public.allowed_emails
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 4. Create function to check if email is allowed
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

-- 5. Update the user creation trigger to check allowed emails
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

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.allowed_emails TO authenticated;

-- 7. Add the requested email addresses to the allowed list
INSERT INTO public.allowed_emails (email) VALUES 
  ('jdpinetta@gmail.com'),
  ('bigstepidiomas@gmail.com'),
  ('naguipinetta@gmail.com'),
  ('jpinetta@descartes.com'),
  ('vtheimann@descartes.com'),
  ('jbruno@descartes.com')
ON CONFLICT (email) DO NOTHING;

-- 8. Also allow the @descartes.com domain for convenience
INSERT INTO public.allowed_emails (domain) VALUES 
  ('@descartes.com')
ON CONFLICT (domain) DO NOTHING;

SELECT 'Allowed emails setup completed successfully!' as status;
SELECT 'Added emails:' as info;
SELECT email FROM public.allowed_emails WHERE email IS NOT NULL;
SELECT 'Added domains:' as info;
SELECT domain FROM public.allowed_emails WHERE domain IS NOT NULL; 
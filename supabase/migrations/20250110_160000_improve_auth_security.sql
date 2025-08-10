-- Migration: Improve Auth Security Settings
-- Description: Documentation for auth settings that need to be configured in Supabase Dashboard
-- Created: 2025-01-10

-- NOTE: These settings must be configured in the Supabase Dashboard under Authentication settings
-- This migration serves as documentation of the required security improvements

/*
REQUIRED AUTH CONFIGURATION CHANGES (Configure in Supabase Dashboard):

1. EMAIL OTP EXPIRY SETTING:
   - Navigate to: Authentication > Settings > Email
   - Set "Email OTP expiry" to 3600 seconds (1 hour) or less
   - Current setting appears to be longer than recommended
   - Recommended: 1800 seconds (30 minutes) for better security

2. LEAKED PASSWORD PROTECTION:
   - Navigate to: Authentication > Settings > Password
   - Enable "Password strength validation"
   - Enable "Check against HaveIBeenPwned database" 
   - This prevents users from using compromised passwords

3. ADDITIONAL SECURITY RECOMMENDATIONS:
   - Enable "Require email confirmation" for new signups
   - Set minimum password strength requirements
   - Consider enabling "Double opt-in for email changes"
   - Enable "Secure email change" requiring confirmation from both old and new email
*/

-- Create a table to track security configuration status
CREATE TABLE IF NOT EXISTS public.security_config_status (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    config_item text NOT NULL UNIQUE,
    status text NOT NULL CHECK (status IN ('pending', 'configured', 'not_applicable')),
    description text,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES public.profiles(id)
);

-- Insert security configuration items to track
INSERT INTO public.security_config_status (config_item, status, description) VALUES
('email_otp_expiry', 'pending', 'Email OTP expiry should be set to 1 hour or less'),
('leaked_password_protection', 'pending', 'Enable HaveIBeenPwned password checking'),
('email_confirmation_required', 'pending', 'Require email confirmation for new signups'),
('minimum_password_strength', 'pending', 'Set appropriate minimum password requirements'),
('secure_email_change', 'pending', 'Enable secure email change process')
ON CONFLICT (config_item) DO NOTHING;

-- Create function to update security config status
CREATE OR REPLACE FUNCTION public.update_security_config_status(
    p_config_item text,
    p_status text,
    p_description text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.security_config_status
    SET status = p_status,
        description = COALESCE(p_description, description),
        updated_at = now(),
        updated_by = auth.uid()
    WHERE config_item = p_config_item;
END;
$$;

-- Add RLS policies for security_config_status
ALTER TABLE public.security_config_status ENABLE ROW LEVEL SECURITY;

-- Only super_admins can read security configuration status
CREATE POLICY "Super admins can read security config status"
ON public.security_config_status FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.program_members pm
    WHERE pm.user_id = auth.uid()
    AND pm.role = 'super_admin'
  )
);

-- Only super_admins can update security configuration status
CREATE POLICY "Super admins can update security config status"
ON public.security_config_status FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.program_members pm
    WHERE pm.user_id = auth.uid()
    AND pm.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.program_members pm
    WHERE pm.user_id = auth.uid()
    AND pm.role = 'super_admin'
  )
);

-- Grant permissions
GRANT SELECT ON public.security_config_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_security_config_status TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.security_config_status IS 'Tracks implementation status of security configuration items';
COMMENT ON FUNCTION public.update_security_config_status IS 'Updates security configuration status - only callable by super_admins due to RLS on underlying table';

-- Example usage query for administrators:
-- SELECT * FROM public.security_config_status ORDER BY status, config_item;
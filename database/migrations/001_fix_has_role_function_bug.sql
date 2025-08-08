-- Migration: Fix has_role function bug
-- Description: The current function incorrectly references a non-existent 'role' column. 
-- Fix it to properly check if the provided role exists in the roles array.

-- Fix the has_role function to properly check if the provided role exists in the roles array
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, target_role user_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the target_role is in the user's roles array
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND target_role = ANY(roles)
  );
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION public.has_role(uuid, user_role) IS 
'Check if a user has a specific role in their roles array. Returns true if the target_role is found in the user''s roles array.';
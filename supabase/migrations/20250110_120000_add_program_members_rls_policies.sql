-- Migration: Add RLS Policies for Program Members
-- Description: Critical security fix - adds comprehensive RLS policies for program_members table
-- Created: 2025-01-10

-- Add RLS policies for program_members table
-- This table manages role assignments for users in programs

-- Policy: Users can read their own program memberships
CREATE POLICY "Users can read their own program memberships"
ON public.program_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Program admins can read all memberships for their programs
CREATE POLICY "Program admins can read program memberships"
ON public.program_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.program_members pm
    WHERE pm.program_id = program_members.program_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('program_admin', 'super_admin')
  )
);

-- Policy: Super admins can read all memberships
CREATE POLICY "Super admins can read all memberships"
ON public.program_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.program_members pm
    WHERE pm.user_id = auth.uid()
    AND pm.role = 'super_admin'
  )
);

-- Policy: Program admins can insert new memberships for their programs
CREATE POLICY "Program admins can add members to their programs"
ON public.program_members FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.program_members pm
    WHERE pm.program_id = program_members.program_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('program_admin', 'super_admin')
  )
);

-- Policy: Super admins can insert memberships for any program
CREATE POLICY "Super admins can add members to any program"
ON public.program_members FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.program_members pm
    WHERE pm.user_id = auth.uid()
    AND pm.role = 'super_admin'
  )
);

-- Policy: Program admins can update memberships in their programs (but not their own role)
CREATE POLICY "Program admins can update program memberships"
ON public.program_members FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.program_members pm
    WHERE pm.program_id = program_members.program_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('program_admin', 'super_admin')
  )
  -- Prevent admins from changing their own role
  AND NOT (user_id = auth.uid() AND role != (SELECT role FROM program_members WHERE id = program_members.id))
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.program_members pm
    WHERE pm.program_id = program_members.program_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('program_admin', 'super_admin')
  )
  -- Prevent admins from changing their own role
  AND NOT (user_id = auth.uid() AND role != (SELECT role FROM program_members WHERE id = program_members.id))
);

-- Policy: Super admins can update any membership
CREATE POLICY "Super admins can update any membership"
ON public.program_members FOR UPDATE
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

-- Policy: Program admins can delete memberships from their programs (but not themselves)
CREATE POLICY "Program admins can remove members from their programs"
ON public.program_members FOR DELETE
TO authenticated
USING (
  user_id != auth.uid() -- Cannot delete their own membership
  AND EXISTS (
    SELECT 1 FROM public.program_members pm
    WHERE pm.program_id = program_members.program_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('program_admin', 'super_admin')
  )
);

-- Policy: Super admins can delete any membership (including their own)
CREATE POLICY "Super admins can remove any membership"
ON public.program_members FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.program_members pm
    WHERE pm.user_id = auth.uid()
    AND pm.role = 'super_admin'
  )
);

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_program_members_user_id ON public.program_members(user_id);
CREATE INDEX IF NOT EXISTS idx_program_members_program_id ON public.program_members(program_id);
CREATE INDEX IF NOT EXISTS idx_program_members_role ON public.program_members(role);
CREATE INDEX IF NOT EXISTS idx_program_members_program_user ON public.program_members(program_id, user_id);

-- Add helpful comments
COMMENT ON TABLE public.program_members IS 'Manages user role assignments within programs. Critical for authorization.';
COMMENT ON COLUMN public.program_members.role IS 'Role values: super_admin, program_admin, instructor, reviewer, applicant, participant';
-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION has_role(user_id UUID, role user_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = ANY(roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is program admin
CREATE OR REPLACE FUNCTION is_program_admin(user_id UUID, program_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM programs WHERE id = program_id AND created_by = user_id
  ) OR EXISTS (
    SELECT 1 FROM program_members 
    WHERE program_members.program_id = is_program_admin.program_id 
    AND program_members.user_id = is_program_admin.user_id 
    AND role = 'program_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles" ON profiles
  FOR SELECT USING (has_role(auth.uid(), 'super_admin'));

-- Profile is created automatically on signup
CREATE POLICY "Enable insert for authentication" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- PROGRAMS POLICIES
-- Anyone can view published programs
CREATE POLICY "Anyone can view published programs" ON programs
  FOR SELECT USING (status != 'draft');

-- Program admins can create programs
CREATE POLICY "Program admins can create programs" ON programs
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'program_admin') OR 
    has_role(auth.uid(), 'super_admin')
  );

-- Program admins can update their own programs
CREATE POLICY "Program admins can update own programs" ON programs
  FOR UPDATE USING (is_program_admin(auth.uid(), id));

-- Program admins can delete their own programs
CREATE POLICY "Program admins can delete own programs" ON programs
  FOR DELETE USING (is_program_admin(auth.uid(), id));

-- APPLICATION QUESTIONS POLICIES
-- Anyone can view questions for published programs
CREATE POLICY "View questions for published programs" ON application_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM programs 
      WHERE programs.id = application_questions.program_id 
      AND programs.status != 'draft'
    )
  );

-- Program admins can manage questions
CREATE POLICY "Program admins can manage questions" ON application_questions
  FOR ALL USING (is_program_admin(auth.uid(), program_id));

-- APPLICATIONS POLICIES
-- Applicants can view their own applications
CREATE POLICY "Applicants can view own applications" ON applications
  FOR SELECT USING (auth.uid() = applicant_id);

-- Applicants can create applications
CREATE POLICY "Applicants can create applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_id);

-- Applicants can update their draft applications
CREATE POLICY "Applicants can update draft applications" ON applications
  FOR UPDATE USING (
    auth.uid() = applicant_id AND 
    status = 'draft'
  );

-- Program admins can view applications for their programs
CREATE POLICY "Program admins can view program applications" ON applications
  FOR SELECT USING (
    is_program_admin(auth.uid(), program_id)
  );

-- Reviewers can view assigned applications
CREATE POLICY "Reviewers can view assigned applications" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM review_assignments
      WHERE review_assignments.application_id = applications.id
      AND review_assignments.reviewer_id = auth.uid()
    )
  );

-- DOCUMENTS POLICIES
-- Users can view their own documents
CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT USING (uploaded_by = auth.uid());

-- Users can upload documents for their applications
CREATE POLICY "Users can upload documents" ON documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = documents.application_id
      AND applications.applicant_id = auth.uid()
    )
  );

-- Program admins and reviewers can view application documents
CREATE POLICY "Program staff can view documents" ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications
      JOIN programs ON applications.program_id = programs.id
      WHERE applications.id = documents.application_id
      AND (
        is_program_admin(auth.uid(), programs.id) OR
        EXISTS (
          SELECT 1 FROM review_assignments
          WHERE review_assignments.application_id = applications.id
          AND review_assignments.reviewer_id = auth.uid()
        )
      )
    )
  );

-- REVIEW ASSIGNMENTS POLICIES
-- Reviewers can view their assignments
CREATE POLICY "Reviewers can view own assignments" ON review_assignments
  FOR SELECT USING (reviewer_id = auth.uid());

-- Program admins can manage assignments
CREATE POLICY "Program admins can manage assignments" ON review_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM applications
      JOIN programs ON applications.program_id = programs.id
      WHERE applications.id = review_assignments.application_id
      AND is_program_admin(auth.uid(), programs.id)
    )
  );

-- REVIEWS POLICIES
-- Reviewers can manage their own reviews
CREATE POLICY "Reviewers can manage own reviews" ON reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM review_assignments
      WHERE review_assignments.id = reviews.assignment_id
      AND review_assignments.reviewer_id = auth.uid()
    )
  );

-- Program admins can view all reviews
CREATE POLICY "Program admins can view reviews" ON reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM review_assignments
      JOIN applications ON review_assignments.application_id = applications.id
      JOIN programs ON applications.program_id = programs.id
      WHERE review_assignments.id = reviews.assignment_id
      AND is_program_admin(auth.uid(), programs.id)
    )
  );

-- PARTICIPANTS POLICIES
-- Participants can view their own participation
CREATE POLICY "Participants can view own participation" ON participants
  FOR SELECT USING (user_id = auth.uid());

-- Program admins can manage participants
CREATE POLICY "Program admins can manage participants" ON participants
  FOR ALL USING (is_program_admin(auth.uid(), program_id));

-- Instructors can view participants
CREATE POLICY "Instructors can view participants" ON participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM program_members
      WHERE program_members.program_id = participants.program_id
      AND program_members.user_id = auth.uid()
      AND program_members.role = 'instructor'
    )
  );

-- ANNOUNCEMENTS POLICIES
-- Relevant users can view announcements
CREATE POLICY "Users can view relevant announcements" ON announcements
  FOR SELECT USING (
    -- Participants
    ('participants' = ANY(target_audience) AND EXISTS (
      SELECT 1 FROM participants
      WHERE participants.program_id = announcements.program_id
      AND participants.user_id = auth.uid()
    )) OR
    -- Applicants
    ('applicants' = ANY(target_audience) AND EXISTS (
      SELECT 1 FROM applications
      WHERE applications.program_id = announcements.program_id
      AND applications.applicant_id = auth.uid()
    )) OR
    -- Reviewers
    ('reviewers' = ANY(target_audience) AND EXISTS (
      SELECT 1 FROM review_assignments
      JOIN applications ON review_assignments.application_id = applications.id
      WHERE applications.program_id = announcements.program_id
      AND review_assignments.reviewer_id = auth.uid()
    ))
  );

-- Program admins can manage announcements
CREATE POLICY "Program admins can manage announcements" ON announcements
  FOR ALL USING (is_program_admin(auth.uid(), program_id));

-- NOTIFICATION PREFERENCES POLICIES
-- Users can manage their own preferences
CREATE POLICY "Users can manage own notification preferences" ON notification_preferences
  FOR ALL USING (user_id = auth.uid());
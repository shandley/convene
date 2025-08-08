-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('application-documents', 'application-documents', false),
  ('program-materials', 'program-materials', false);

-- Storage policies for application documents
CREATE POLICY "Users can upload own application documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'application-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own application documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'application-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own application documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'application-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Program admins and reviewers can view application documents
CREATE POLICY "Program staff can view application documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'application-documents' AND
    (
      -- Check if user is a program admin or reviewer for this application
      EXISTS (
        SELECT 1 FROM applications a
        JOIN programs p ON a.program_id = p.id
        WHERE 
          a.applicant_id::text = (storage.foldername(name))[1] AND
          (
            is_program_admin(auth.uid(), p.id) OR
            EXISTS (
              SELECT 1 FROM review_assignments ra
              WHERE ra.application_id = a.id AND ra.reviewer_id = auth.uid()
            )
          )
      )
    )
  );

-- Storage policies for program materials
CREATE POLICY "Program admins can upload materials" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'program-materials' AND
    EXISTS (
      SELECT 1 FROM programs
      WHERE id::text = (storage.foldername(name))[1]
      AND is_program_admin(auth.uid(), id)
    )
  );

CREATE POLICY "Program admins can manage materials" ON storage.objects
  FOR ALL USING (
    bucket_id = 'program-materials' AND
    EXISTS (
      SELECT 1 FROM programs
      WHERE id::text = (storage.foldername(name))[1]
      AND is_program_admin(auth.uid(), id)
    )
  );

CREATE POLICY "Participants can view program materials" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'program-materials' AND
    EXISTS (
      SELECT 1 FROM participants
      WHERE program_id::text = (storage.foldername(name))[1]
      AND user_id = auth.uid()
    )
  );
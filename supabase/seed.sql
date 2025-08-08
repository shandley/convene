-- Seed data for development
-- Note: This will only run in development, not in production

-- Create test users (passwords are all 'password123')
-- You'll need to create these users through Supabase Auth first
-- This is just to set up their profiles with appropriate roles

-- After creating users through auth, update their profiles:
-- UPDATE profiles SET roles = ARRAY['super_admin']::user_role[] WHERE email = 'admin@convene.app';
-- UPDATE profiles SET roles = ARRAY['program_admin']::user_role[] WHERE email = 'organizer@convene.app';
-- UPDATE profiles SET roles = ARRAY['reviewer']::user_role[] WHERE email = 'reviewer@convene.app';
-- UPDATE profiles SET roles = ARRAY['applicant']::user_role[] WHERE email = 'applicant@convene.app';

-- Sample program (uncomment after setting up users)
/*
INSERT INTO programs (
  title,
  description,
  type,
  status,
  created_by,
  start_date,
  end_date,
  application_deadline,
  capacity,
  location,
  fee,
  blind_review
) VALUES (
  'Advanced Machine Learning Workshop 2024',
  'A comprehensive workshop on cutting-edge ML techniques including deep learning, reinforcement learning, and generative AI.',
  'workshop',
  'published',
  (SELECT id FROM profiles WHERE email = 'organizer@convene.app'),
  '2024-06-15',
  '2024-06-20',
  '2024-05-01 23:59:59',
  30,
  'Stanford University, Palo Alto, CA',
  500.00,
  false
);

-- Add sample application questions
INSERT INTO application_questions (program_id, question_text, question_type, required, order_index) 
VALUES 
  (
    (SELECT id FROM programs WHERE title = 'Advanced Machine Learning Workshop 2024'),
    'What is your experience with machine learning?',
    'textarea',
    true,
    1
  ),
  (
    (SELECT id FROM programs WHERE title = 'Advanced Machine Learning Workshop 2024'),
    'What do you hope to learn from this workshop?',
    'textarea',
    true,
    2
  ),
  (
    (SELECT id FROM programs WHERE title = 'Advanced Machine Learning Workshop 2024'),
    'Upload your CV/Resume',
    'file',
    true,
    3
  );
*/
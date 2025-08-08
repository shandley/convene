-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('super_admin', 'program_admin', 'instructor', 'reviewer', 'applicant', 'participant');
CREATE TYPE program_status AS ENUM ('draft', 'published', 'applications_open', 'applications_closed', 'in_review', 'selections_made', 'active', 'completed', 'cancelled');
CREATE TYPE application_status AS ENUM ('draft', 'submitted', 'under_review', 'accepted', 'rejected', 'waitlisted', 'withdrawn');
CREATE TYPE review_status AS ENUM ('not_started', 'in_progress', 'completed');

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  institution TEXT,
  department TEXT,
  bio TEXT,
  roles user_role[] DEFAULT ARRAY['applicant']::user_role[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create programs table
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- workshop, conference, symposium, etc.
  status program_status DEFAULT 'draft',
  created_by UUID REFERENCES profiles(id) NOT NULL,
  
  -- Schedule
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  application_deadline TIMESTAMPTZ NOT NULL,
  
  -- Capacity
  capacity INTEGER NOT NULL,
  waitlist_capacity INTEGER DEFAULT 10,
  current_enrolled INTEGER DEFAULT 0,
  current_waitlisted INTEGER DEFAULT 0,
  
  -- Location & Fee
  location TEXT,
  fee DECIMAL(10, 2) DEFAULT 0,
  
  -- Settings
  blind_review BOOLEAN DEFAULT false,
  auto_waitlist_promotion BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_deadline CHECK (application_deadline < start_date),
  CONSTRAINT valid_capacity CHECK (capacity > 0)
);

-- Create application questions template
CREATE TABLE application_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- text, textarea, select, multiselect, file
  required BOOLEAN DEFAULT true,
  options JSONB, -- For select/multiselect types
  order_index INTEGER NOT NULL,
  max_length INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(program_id, order_index)
);

-- Create applications table
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) NOT NULL,
  applicant_id UUID REFERENCES profiles(id) NOT NULL,
  status application_status DEFAULT 'draft',
  
  -- Application data
  responses JSONB NOT NULL DEFAULT '{}', -- Stores answers to custom questions
  statement_of_interest TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one application per user per program
  UNIQUE(program_id, applicant_id)
);

-- Create documents table for file uploads
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create review assignments table
CREATE TABLE review_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) NOT NULL,
  assigned_by UUID REFERENCES profiles(id) NOT NULL,
  status review_status DEFAULT 'not_started',
  deadline DATE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  UNIQUE(application_id, reviewer_id)
);

-- Create reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES review_assignments(id) ON DELETE CASCADE,
  
  -- Scoring
  overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 5),
  criteria_scores JSONB DEFAULT '{}', -- Individual criteria scores
  
  -- Feedback
  strengths TEXT,
  weaknesses TEXT,
  comments TEXT,
  recommendation TEXT, -- accept, reject, waitlist
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(assignment_id)
);

-- Create program members table (instructors, admins for specific programs)
CREATE TABLE program_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  role TEXT NOT NULL, -- program_admin, instructor
  added_by UUID REFERENCES profiles(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(program_id, user_id)
);

-- Create participants table (accepted applicants)
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  application_id UUID REFERENCES applications(id),
  status TEXT DEFAULT 'confirmed', -- confirmed, declined, withdrawn
  confirmed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(program_id, user_id)
);

-- Create announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  target_audience TEXT[], -- ['participants', 'applicants', 'reviewers']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notification preferences table
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  application_updates BOOLEAN DEFAULT true,
  review_assignments BOOLEAN DEFAULT true,
  program_announcements BOOLEAN DEFAULT true,
  deadline_reminders BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_programs_status ON programs(status);
CREATE INDEX idx_programs_created_by ON programs(created_by);
CREATE INDEX idx_applications_program ON applications(program_id);
CREATE INDEX idx_applications_applicant ON applications(applicant_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_review_assignments_application ON review_assignments(application_id);
CREATE INDEX idx_review_assignments_reviewer ON review_assignments(reviewer_id);
CREATE INDEX idx_participants_program ON participants(program_id);
CREATE INDEX idx_participants_user ON participants(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
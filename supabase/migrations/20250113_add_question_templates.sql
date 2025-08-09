-- Add comprehensive question templates for program creators to choose from
-- These templates cover common application questions across different categories

-- Clear existing system templates to avoid duplicates
DELETE FROM question_templates WHERE is_system_template = true;

-- Personal Information Templates
INSERT INTO question_templates (
    title, description, category, question_text, question_type, 
    help_text, required, is_system_template, is_public, tags, max_length
) VALUES 
-- Basic Info
('Full Name', 'Applicant full legal name', 'personal_info', 
 'What is your full name?', 'text',
 'Please enter your full legal name as it appears on official documents.', 
 true, true, true, ARRAY['personal', 'name', 'basic', 'required'], 200),

('Preferred Name', 'Name applicant prefers to be called', 'personal_info',
 'What is your preferred name?', 'text',
 'If different from your legal name, please tell us what you would like to be called.',
 false, true, true, ARRAY['personal', 'name', 'optional'], 100),

('Email Address', 'Primary contact email', 'personal_info',
 'What is your email address?', 'email',
 'Please provide a valid email address where we can contact you.',
 true, true, true, ARRAY['personal', 'contact', 'email', 'required'], null),

('Phone Number', 'Contact phone number', 'personal_info',
 'What is your phone number?', 'phone',
 'Please include country code if outside the US.',
 false, true, true, ARRAY['personal', 'contact', 'phone'], null),

('Current Institution', 'Applicant institutional affiliation', 'background',
 'What institution or organization are you affiliated with?', 'text',
 'Please provide the name of your current primary institutional affiliation.',
 true, true, true, ARRAY['background', 'institution', 'affiliation'], 200),

('Department/Program', 'Academic department or program', 'background',
 'What is your department or program?', 'text',
 'Please specify your academic department, research group, or program.',
 false, true, true, ARRAY['background', 'academic', 'department'], 200),

('Position/Title', 'Current position or title', 'background',
 'What is your current position or title?', 'select',
 'Please select your current career stage or position.',
 true, true, true, ARRAY['background', 'career', 'position'], null),

('Career Stage', 'Academic career stage', 'background',
 'What is your current career stage?', 'select',
 'Please select the option that best describes your current career stage.',
 true, true, true, ARRAY['background', 'career', 'academic'], null);

-- Set options for select fields
UPDATE question_templates 
SET options = '["Undergraduate Student", "Graduate Student (Masters)", "Graduate Student (PhD)", "Postdoctoral Researcher", "Research Scientist", "Assistant Professor", "Associate Professor", "Full Professor", "Industry Professional", "Other"]'::jsonb
WHERE title = 'Position/Title' AND is_system_template = true;

UPDATE question_templates 
SET options = '["Early Career (0-5 years)", "Mid Career (5-15 years)", "Senior Career (15+ years)", "Student", "Not Applicable"]'::jsonb
WHERE title = 'Career Stage' AND is_system_template = true;

-- Background and Experience Templates
INSERT INTO question_templates (
    title, description, category, question_text, question_type, 
    help_text, required, is_system_template, is_public, tags, max_length
) VALUES 
('Research Interests', 'Brief description of research interests', 'background',
 'Please briefly describe your research interests.', 'textarea',
 'Provide a brief overview of your current research interests and areas of expertise (200-500 words).',
 true, true, true, ARRAY['background', 'research', 'interests'], 2000),

('Relevant Experience', 'Previous relevant experience', 'background',
 'Please describe any relevant experience or background.', 'textarea',
 'Describe any previous experience, training, or background relevant to this program.',
 false, true, true, ARRAY['background', 'experience'], 1500),

('Technical Skills', 'List of technical skills', 'background',
 'Please list your relevant technical skills.', 'textarea',
 'List any technical skills, programming languages, software, or methodologies relevant to this program.',
 false, true, true, ARRAY['background', 'skills', 'technical'], 1000);

-- Essay Questions Templates
INSERT INTO question_templates (
    title, description, category, question_text, question_type, 
    help_text, required, is_system_template, is_public, tags, max_length
) VALUES 
('Statement of Interest', 'Why interested in the program', 'essays',
 'Please describe your interest in this program and what you hope to gain from participating.', 'textarea',
 'Write a brief statement (250-500 words) explaining your motivation and goals.',
 true, true, true, ARRAY['essay', 'statement', 'interest', 'motivation'], 3000),

('Project Proposal', 'Proposed project or research', 'essays',
 'Please describe a project or research question you would like to work on during the program.', 'textarea',
 'Outline a specific project or research question you would like to pursue (500-1000 words).',
 false, true, true, ARRAY['essay', 'project', 'proposal', 'research'], 5000),

('Learning Goals', 'What applicant hopes to learn', 'essays',
 'What are your learning goals for this program?', 'textarea',
 'Describe what you hope to learn and how it will benefit your work or research.',
 true, true, true, ARRAY['essay', 'goals', 'learning'], 2000),

('Contribution to Program', 'How applicant will contribute', 'essays',
 'How do you plan to contribute to the program community?', 'textarea',
 'Describe what unique perspectives, skills, or experiences you will bring to the program.',
 false, true, true, ARRAY['essay', 'contribution', 'community'], 2000);

-- Document Upload Templates
INSERT INTO question_templates (
    title, description, category, question_text, question_type, 
    help_text, required, is_system_template, is_public, tags, 
    allowed_file_types, max_file_size_mb, max_files
) VALUES 
('CV/Resume', 'Curriculum vitae or resume upload', 'documents',
 'Please upload your current CV or resume.', 'file',
 'Upload your most recent CV or resume in PDF format (max 10MB).',
 true, true, true, ARRAY['document', 'cv', 'resume'],
 ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
 10, 1),

('Letter of Recommendation', 'Reference letter upload', 'documents',
 'Please upload letters of recommendation.', 'file',
 'Upload 1-3 letters of recommendation in PDF format. You may also have recommenders send letters directly to the program coordinator.',
 false, true, true, ARRAY['document', 'recommendation', 'reference'],
 ARRAY['application/pdf'], 5, 3),

('Writing Sample', 'Academic writing sample', 'documents',
 'Please upload a writing sample.', 'file',
 'Upload a recent academic paper, report, or other writing sample that demonstrates your work (PDF, max 20MB).',
 false, true, true, ARRAY['document', 'writing', 'sample'],
 ARRAY['application/pdf'], 20, 1),

('Transcript', 'Academic transcript upload', 'documents',
 'Please upload your academic transcript(s).', 'file',
 'Upload unofficial transcripts from all institutions attended. Official transcripts may be required if accepted.',
 false, true, true, ARRAY['document', 'transcript', 'academic'],
 ARRAY['application/pdf'], 10, 5);

-- Logistics and Preferences Templates
INSERT INTO question_templates (
    title, description, category, question_text, question_type, 
    help_text, required, is_system_template, is_public, tags, max_length
) VALUES 
('Dietary Restrictions', 'Food allergies and dietary needs', 'preferences',
 'Do you have any dietary restrictions or food allergies?', 'textarea',
 'Please list any dietary restrictions, allergies, or special meal requirements.',
 false, true, true, ARRAY['dietary', 'allergies', 'preferences', 'food'], 500),

('Accessibility Needs', 'Accommodation requirements', 'preferences',
 'Do you require any accessibility accommodations?', 'textarea',
 'Please describe any accessibility needs or accommodations we should be aware of.',
 false, true, true, ARRAY['accessibility', 'accommodation', 'needs'], 500),

('Emergency Contact', 'Emergency contact information', 'personal_info',
 'Please provide emergency contact information.', 'textarea',
 'Include name, relationship, phone number, and email address of someone we can contact in case of emergency.',
 true, true, true, ARRAY['emergency', 'contact', 'safety'], 500),

('Travel Support Needed', 'Whether applicant needs travel funding', 'preferences',
 'Will you need travel support to attend the program?', 'select',
 'Please indicate if you will need financial support for travel expenses.',
 false, true, true, ARRAY['travel', 'funding', 'support'], null),

('Visa Required', 'Whether applicant needs visa support', 'preferences',
 'Will you require visa support to attend?', 'select',
 'Please indicate if you will need a visa or invitation letter to attend the program.',
 false, true, true, ARRAY['visa', 'international', 'travel'], null);

-- Set options for travel and visa questions
UPDATE question_templates 
SET options = '["Yes, full support needed", "Yes, partial support needed", "No, I have other funding", "Not applicable (local)"]'::jsonb
WHERE title = 'Travel Support Needed' AND is_system_template = true;

UPDATE question_templates 
SET options = '["Yes, I will need visa support", "No, I do not need visa support", "Not sure yet"]'::jsonb
WHERE title = 'Visa Required' AND is_system_template = true;

-- Demographic Questions (Optional, for diversity tracking)
INSERT INTO question_templates (
    title, description, category, question_text, question_type, 
    help_text, required, is_system_template, is_public, tags
) VALUES 
('Gender Identity', 'Optional gender identity question', 'custom',
 'How do you identify? (Optional)', 'select',
 'This information helps us track diversity. You may prefer not to answer.',
 false, true, true, ARRAY['demographics', 'gender', 'optional', 'diversity']),

('Underrepresented Group', 'Member of underrepresented group', 'custom',
 'Do you identify as a member of a group underrepresented in your field? (Optional)', 'select',
 'This information helps us ensure diverse participation. You may prefer not to answer.',
 false, true, true, ARRAY['demographics', 'diversity', 'optional', 'underrepresented']);

-- Set options for demographic questions
UPDATE question_templates 
SET options = '["Woman", "Man", "Non-binary", "Prefer to self-describe", "Prefer not to answer"]'::jsonb
WHERE title = 'Gender Identity' AND is_system_template = true;

UPDATE question_templates 
SET options = '["Yes", "No", "Prefer not to answer"]'::jsonb
WHERE title = 'Underrepresented Group' AND is_system_template = true;

-- Additional Templates
INSERT INTO question_templates (
    title, description, category, question_text, question_type, 
    help_text, required, is_system_template, is_public, tags, max_length
) VALUES 
('How Did You Hear About Us', 'Referral source', 'custom',
 'How did you hear about this program?', 'select',
 'This helps us understand which outreach methods are most effective.',
 false, true, true, ARRAY['marketing', 'referral', 'optional'], null),

('Previous Participation', 'Whether attended before', 'custom',
 'Have you participated in our programs before?', 'select',
 'Please let us know if you have attended any of our previous programs.',
 false, true, true, ARRAY['history', 'previous', 'participation'], null),

('Additional Comments', 'Any additional information', 'custom',
 'Is there anything else you would like us to know?', 'textarea',
 'Please share any additional information that might be relevant to your application.',
 false, true, true, ARRAY['additional', 'comments', 'optional'], 1000);

-- Set options for additional questions
UPDATE question_templates 
SET options = '["Email from organizer", "Social media", "Department announcement", "Colleague recommendation", "Conference/meeting", "Web search", "Other"]'::jsonb
WHERE title = 'How Did You Hear About Us' AND is_system_template = true;

UPDATE question_templates 
SET options = '["Yes, I have attended before", "No, this is my first time", "I have applied but not attended"]'::jsonb
WHERE title = 'Previous Participation' AND is_system_template = true;

-- Skip creating libraries for now as they require an authenticated user
-- These can be created later through the UI or by an admin

-- For now, just ensure the templates are available

-- Add comment about the templates
COMMENT ON TABLE question_templates IS 'Pre-built question templates that program creators can choose from when building their application forms';
-- Add Review Criteria for Test Program
-- Created: 2025-08-14
-- This migration adds review criteria for the existing test program to fix the scoring system

INSERT INTO review_criteria (program_id, name, description, scoring_type, weight, max_score, min_score, rubric_definition, sort_order) VALUES 
('547a66aa-87ec-4e01-83a5-d43d3a5edc5e', 'Technical Background', 'Applicant''s relevant technical skills and experience', 'numerical', 1.50, 10, 0, '{
    "10": "Exceptional technical background, clearly exceeds requirements",
    "8-9": "Strong technical background, meets all requirements well", 
    "6-7": "Good technical background, meets most requirements",
    "4-5": "Basic technical background, meets some requirements",
    "2-3": "Limited technical background, few requirements met",
    "0-1": "Insufficient technical background for program"
}', 1),
('547a66aa-87ec-4e01-83a5-d43d3a5edc5e', 'Motivation and Goals', 'Clarity and alignment of applicant''s goals with workshop objectives', 'numerical', 1.25, 10, 0, '{
    "10": "Exceptional clarity of goals, perfect alignment with workshop",
    "8-9": "Clear goals that align well with workshop objectives",
    "6-7": "Good understanding of goals, reasonable alignment", 
    "4-5": "Basic understanding of goals, some misalignment",
    "2-3": "Unclear goals, poor alignment with workshop",
    "0-1": "No clear goals or major misalignment"
}', 2),
('547a66aa-87ec-4e01-83a5-d43d3a5edc5e', 'Learning Impact Potential', 'Likelihood that applicant will benefit from and contribute to the workshop', 'numerical', 1.00, 10, 0, '{
    "10": "Maximum potential impact, will greatly benefit and contribute",
    "8-9": "High potential impact, strong benefit and contribution expected",
    "6-7": "Good potential impact, will benefit and contribute well",
    "4-5": "Moderate potential impact, some benefit and contribution",
    "2-3": "Limited potential impact, minimal benefit or contribution", 
    "0-1": "Little to no potential impact"
}', 3),
('547a66aa-87ec-4e01-83a5-d43d3a5edc5e', 'Communication Skills', 'Quality of written communication and ability to articulate ideas', 'numerical', 0.75, 10, 0, '{
    "10": "Exceptional communication, articulate and engaging",
    "8-9": "Strong communication skills, clear and well-organized",
    "6-7": "Good communication, mostly clear and coherent",
    "4-5": "Basic communication, understandable but may lack clarity",
    "2-3": "Poor communication, difficult to understand",
    "0-1": "Very poor communication, major clarity issues"  
}', 4);
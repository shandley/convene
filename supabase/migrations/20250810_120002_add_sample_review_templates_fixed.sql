-- Sample Review Templates and Data
-- Created: 2025-08-10
-- This migration adds sample rubric templates for common program types

-- Insert sample review criteria templates
INSERT INTO review_criteria_templates (name, description, category, criteria_definition, total_max_score) VALUES 
(
    'Standard Workshop Evaluation',
    'Comprehensive rubric for workshop applications including technical background, motivation, and fit',
    'workshop',
    '[
        {
            "name": "Technical Background",
            "description": "Applicant'\'s relevant technical skills and experience",
            "scoring_type": "numerical",
            "weight": 1.5,
            "max_score": 10,
            "min_score": 0,
            "rubric_definition": {
                "10": "Exceptional technical background, clearly exceeds requirements",
                "8-9": "Strong technical background, meets all requirements well",
                "6-7": "Good technical background, meets most requirements",
                "4-5": "Basic technical background, meets some requirements",
                "2-3": "Limited technical background, few requirements met",
                "0-1": "Insufficient technical background for program"
            }
        },
        {
            "name": "Motivation and Goals",
            "description": "Clarity and alignment of applicant'\'s goals with workshop objectives",
            "scoring_type": "numerical", 
            "weight": 1.25,
            "max_score": 10,
            "min_score": 0,
            "rubric_definition": {
                "10": "Exceptional clarity of goals, perfect alignment with workshop",
                "8-9": "Clear goals that align well with workshop objectives",
                "6-7": "Good understanding of goals, reasonable alignment",
                "4-5": "Basic understanding of goals, some misalignment",
                "2-3": "Unclear goals, poor alignment with workshop",
                "0-1": "No clear goals or major misalignment"
            }
        },
        {
            "name": "Learning Impact Potential",
            "description": "Likelihood that applicant will benefit from and contribute to the workshop",
            "scoring_type": "numerical",
            "weight": 1.0,
            "max_score": 10,
            "min_score": 0,
            "rubric_definition": {
                "10": "Maximum potential impact, will greatly benefit and contribute",
                "8-9": "High potential impact, strong benefit and contribution expected",
                "6-7": "Good potential impact, will benefit and contribute well",
                "4-5": "Moderate potential impact, some benefit and contribution",
                "2-3": "Limited potential impact, minimal benefit or contribution",
                "0-1": "Little to no potential impact"
            }
        },
        {
            "name": "Communication Skills",
            "description": "Quality of written communication and ability to articulate ideas",
            "scoring_type": "numerical",
            "weight": 0.75,
            "max_score": 10,
            "min_score": 0,
            "rubric_definition": {
                "10": "Exceptional communication, articulate and engaging",
                "8-9": "Strong communication skills, clear and well-organized",
                "6-7": "Good communication, mostly clear and coherent",
                "4-5": "Basic communication, understandable but may lack clarity",
                "2-3": "Poor communication, difficult to understand",
                "0-1": "Very poor communication, major clarity issues"
            }
        }
    ]',
    100
),
(
    'Conference Presentation Review',
    'Evaluation criteria for conference presentation proposals',
    'conference',
    '[
        {
            "name": "Novelty and Innovation",
            "description": "Originality and innovative aspects of the proposed presentation",
            "scoring_type": "numerical",
            "weight": 2.0,
            "max_score": 10,
            "min_score": 0,
            "rubric_definition": {
                "10": "Groundbreaking, highly novel contribution",
                "8-9": "Very innovative with significant novel elements",
                "6-7": "Good innovation, some novel contributions",
                "4-5": "Moderate innovation, limited novelty",
                "2-3": "Little innovation, mostly known material",
                "0-1": "No innovation, entirely familiar content"
            }
        },
        {
            "name": "Technical Quality",
            "description": "Soundness and rigor of technical approach and methodology",
            "scoring_type": "numerical",
            "weight": 1.75,
            "max_score": 10,
            "min_score": 0,
            "rubric_definition": {
                "10": "Exceptional technical quality, rigorous methodology",
                "8-9": "High technical quality, sound approach",
                "6-7": "Good technical quality, mostly sound",
                "4-5": "Adequate technical quality, some concerns",
                "2-3": "Poor technical quality, significant issues",
                "0-1": "Very poor technical quality, fundamental flaws"
            }
        },
        {
            "name": "Audience Relevance",
            "description": "Relevance and value to the target conference audience",
            "scoring_type": "numerical",
            "weight": 1.25,
            "max_score": 10,
            "min_score": 0,
            "rubric_definition": {
                "10": "Extremely relevant, high value to audience",
                "8-9": "Very relevant, clear value to audience",
                "6-7": "Good relevance, moderate value",
                "4-5": "Some relevance, limited value",
                "2-3": "Poor relevance, little value",
                "0-1": "Not relevant, no clear value"
            }
        },
        {
            "name": "Presentation Clarity",
            "description": "Clarity of presentation plan and communication approach",
            "scoring_type": "numerical",
            "weight": 1.0,
            "max_score": 10,
            "min_score": 0,
            "rubric_definition": {
                "10": "Exceptional clarity, very well planned presentation",
                "8-9": "Clear presentation plan, good communication strategy",
                "6-7": "Good clarity, adequate presentation planning",
                "4-5": "Basic clarity, some presentation planning",
                "2-3": "Poor clarity, little planning evident",
                "0-1": "Very unclear, no clear presentation plan"
            }
        }
    ]',
    100
),
(
    'Hackathon Team Evaluation',
    'Assessment criteria for hackathon team applications',
    'hackathon',
    '[
        {
            "name": "Team Composition",
            "description": "Diversity and complementarity of team skills",
            "scoring_type": "numerical",
            "weight": 1.5,
            "max_score": 10,
            "min_score": 0,
            "rubric_definition": {
                "10": "Perfect team balance, highly complementary skills",
                "8-9": "Excellent team composition, good skill diversity",
                "6-7": "Good team balance, adequate skill coverage",
                "4-5": "Basic team composition, some skill gaps",
                "2-3": "Poor team balance, significant skill gaps",
                "0-1": "Very poor composition, major skill deficiencies"
            }
        },
        {
            "name": "Project Feasibility",
            "description": "Realistic scope and achievability within hackathon timeframe",
            "scoring_type": "numerical",
            "weight": 1.75,
            "max_score": 10,
            "min_score": 0,
            "rubric_definition": {
                "10": "Perfect scope, highly achievable and well-planned",
                "8-9": "Realistic scope, good planning and feasibility",
                "6-7": "Good feasibility, mostly achievable scope",
                "4-5": "Questionable feasibility, may be too ambitious",
                "2-3": "Poor feasibility, likely too ambitious",
                "0-1": "Unrealistic scope, not achievable in timeframe"
            }
        },
        {
            "name": "Innovation Potential",
            "description": "Creativity and potential impact of proposed solution",
            "scoring_type": "numerical",
            "weight": 1.25,
            "max_score": 10,
            "min_score": 0,
            "rubric_definition": {
                "10": "Highly innovative, exceptional creative potential",
                "8-9": "Very innovative, strong creative elements",
                "6-7": "Good innovation, decent creative approach",
                "4-5": "Some innovation, limited creativity",
                "2-3": "Little innovation, conventional approach",
                "0-1": "No innovation, entirely conventional"
            }
        },
        {
            "name": "Technical Approach",
            "description": "Soundness of technical strategy and tools selection",
            "scoring_type": "numerical",
            "weight": 1.0,
            "max_score": 10,
            "min_score": 0,
            "rubric_definition": {
                "10": "Excellent technical approach, perfect tool selection",
                "8-9": "Strong technical strategy, good tool choices",
                "6-7": "Good technical approach, reasonable tool selection",
                "4-5": "Basic technical strategy, adequate tools",
                "2-3": "Poor technical approach, questionable tool choices",
                "0-1": "Very poor technical strategy, inappropriate tools"
            }
        }
    ]',
    100
),
(
    'Fellowship Application Review',
    'Comprehensive evaluation for competitive fellowship programs',
    'fellowship',
    '[
        {
            "name": "Academic Excellence",
            "description": "Academic achievements, GPA, coursework, and scholarly performance",
            "scoring_type": "numerical",
            "weight": 2.0,
            "max_score": 10,
            "min_score": 0,
            "rubric_definition": {
                "10": "Outstanding academic record, exceptional achievements",
                "8-9": "Excellent academic performance, strong achievements",
                "6-7": "Good academic record, solid performance",
                "4-5": "Adequate academic performance, meets requirements",
                "2-3": "Below average academic record, some concerns",
                "0-1": "Poor academic performance, does not meet standards"
            }
        },
        {
            "name": "Research Experience",
            "description": "Quality and depth of research experience and outcomes",
            "scoring_type": "numerical",
            "weight": 1.75,
            "max_score": 10,
            "min_score": 0,
            "rubric_definition": {
                "10": "Exceptional research experience with significant outcomes",
                "8-9": "Strong research background, good outcomes",
                "6-7": "Good research experience, some outcomes",
                "4-5": "Limited research experience, few outcomes",
                "2-3": "Minimal research background",
                "0-1": "No significant research experience"
            }
        },
        {
            "name": "Leadership and Service",
            "description": "Leadership roles, community service, and professional engagement",
            "scoring_type": "numerical",
            "weight": 1.0,
            "max_score": 10,
            "min_score": 0,
            "rubric_definition": {
                "10": "Exceptional leadership, extensive service contributions",
                "8-9": "Strong leadership record, good service",
                "6-7": "Good leadership experience, some service",
                "4-5": "Limited leadership, minimal service",
                "2-3": "Little leadership or service experience",
                "0-1": "No significant leadership or service"
            }
        },
        {
            "name": "Statement of Purpose",
            "description": "Quality and clarity of career goals and fellowship alignment",
            "scoring_type": "numerical",
            "weight": 1.5,
            "max_score": 10,
            "min_score": 0,
            "rubric_definition": {
                "10": "Exceptional statement, perfect alignment with fellowship",
                "8-9": "Strong statement, good alignment and clarity",
                "6-7": "Good statement, clear goals and reasonable alignment",
                "4-5": "Adequate statement, some clarity issues",
                "2-3": "Poor statement, unclear goals or poor alignment",
                "0-1": "Very poor statement, major issues with clarity/alignment"
            }
        },
        {
            "name": "Letters of Recommendation",
            "description": "Quality and strength of recommendation letters",
            "scoring_type": "numerical",
            "weight": 1.25,
            "max_score": 10,
            "min_score": 0,
            "rubric_definition": {
                "10": "Outstanding letters, exceptionally strong support",
                "8-9": "Excellent letters, strong support and detail",
                "6-7": "Good letters, adequate support",
                "4-5": "Average letters, basic support",
                "2-3": "Weak letters, limited support",
                "0-1": "Poor letters, little meaningful support"
            }
        }
    ]',
    100
),
(
    'Basic Binary Assessment',
    'Simple pass/fail evaluation for basic program screening',
    'workshop',
    '[
        {
            "name": "Meets Minimum Requirements",
            "description": "Applicant meets all basic eligibility requirements",
            "scoring_type": "binary",
            "weight": 1.0,
            "max_score": 1,
            "min_score": 0,
            "rubric_definition": {
                "1": "Meets all minimum requirements",
                "0": "Does not meet minimum requirements"
            }
        },
        {
            "name": "Relevant Experience",
            "description": "Has relevant background experience for the program",
            "scoring_type": "binary",
            "weight": 1.0,
            "max_score": 1,
            "min_score": 0,
            "rubric_definition": {
                "1": "Has relevant experience",
                "0": "Lacks relevant experience"
            }
        },
        {
            "name": "Clear Motivation",
            "description": "Demonstrates clear motivation and understanding of program",
            "scoring_type": "binary",
            "weight": 1.0,
            "max_score": 1,
            "min_score": 0,
            "rubric_definition": {
                "1": "Clear motivation and understanding",
                "0": "Unclear motivation or understanding"
            }
        }
    ]',
    3
);

-- Insert sample reviewer expertise data (for demonstration, using placeholder UUIDs)
-- In a real system, these would be tied to actual reviewer profiles
INSERT INTO reviewer_expertise (reviewer_id, expertise_area, proficiency_level, years_of_experience, specialization_tags, total_reviews_completed) VALUES
('00000000-0000-0000-0000-000000000001', 'Software Engineering', 'expert', 15, ARRAY['web development', 'API design', 'full-stack'], 45),
('00000000-0000-0000-0000-000000000001', 'Machine Learning', 'advanced', 8, ARRAY['deep learning', 'NLP', 'computer vision'], 23),
('00000000-0000-0000-0000-000000000002', 'Data Science', 'expert', 12, ARRAY['statistics', 'visualization', 'big data'], 67),
('00000000-0000-0000-0000-000000000002', 'Academia', 'advanced', 6, ARRAY['research', 'publications', 'peer review'], 34),
('00000000-0000-0000-0000-000000000003', 'Product Management', 'advanced', 10, ARRAY['strategy', 'user experience', 'agile'], 28),
('00000000-0000-0000-0000-000000000003', 'Entrepreneurship', 'expert', 18, ARRAY['startups', 'funding', 'business development'], 19)
ON CONFLICT (reviewer_id, expertise_area) DO NOTHING;

-- Note: The reviewer_id values above are placeholder UUIDs for demonstration.
-- In practice, these would be actual profile IDs from the profiles table.
-- The ON CONFLICT clause prevents errors if these placeholder IDs don't exist.
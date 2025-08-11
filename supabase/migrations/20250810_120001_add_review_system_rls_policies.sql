-- RLS Policies for Review Configuration & Scoring System
-- Created: 2025-08-10

-- Enable RLS on all new tables
ALTER TABLE review_criteria_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_expertise ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_scores ENABLE ROW LEVEL SECURITY;

-- Policies for review_criteria_templates
-- Templates are globally readable but only editable by super_admin and program_admin
CREATE POLICY "Templates are viewable by authenticated users" ON review_criteria_templates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Templates can be created by admins" ON review_criteria_templates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND ('super_admin' = ANY(roles) OR 'program_admin' = ANY(roles))
        )
    );

CREATE POLICY "Templates can be updated by admins or creators" ON review_criteria_templates
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND 'super_admin' = ANY(roles)
        )
    );

CREATE POLICY "Templates can be deleted by super_admin only" ON review_criteria_templates
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND 'super_admin' = ANY(roles)
        )
    );

-- Policies for review_settings
-- Only program admins and super admins can manage review settings
CREATE POLICY "Review settings viewable by program stakeholders" ON review_settings
    FOR SELECT USING (
        -- Program admins/creators
        EXISTS (
            SELECT 1 FROM programs p
            WHERE p.id = program_id
            AND (
                p.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM profiles pr
                    WHERE pr.id = auth.uid()
                    AND ('super_admin' = ANY(pr.roles) OR 'program_admin' = ANY(pr.roles))
                )
            )
        ) OR
        -- Assigned reviewers
        EXISTS (
            SELECT 1 FROM review_assignments ra
            JOIN applications a ON a.id = ra.application_id
            WHERE a.program_id = program_id
            AND ra.reviewer_id = auth.uid()
        )
    );

CREATE POLICY "Review settings manageable by program admins" ON review_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM programs p
            WHERE p.id = program_id
            AND (
                p.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM profiles pr
                    WHERE pr.id = auth.uid()
                    AND ('super_admin' = ANY(pr.roles) OR 'program_admin' = ANY(pr.roles))
                )
            )
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM programs p
            WHERE p.id = program_id
            AND (
                p.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM profiles pr
                    WHERE pr.id = auth.uid()
                    AND ('super_admin' = ANY(pr.roles) OR 'program_admin' = ANY(pr.roles))
                )
            )
        )
    );

-- Policies for review_criteria
-- Only program admins can manage review criteria, reviewers can view
CREATE POLICY "Review criteria viewable by program stakeholders" ON review_criteria
    FOR SELECT USING (
        -- Program admins/creators
        EXISTS (
            SELECT 1 FROM programs p
            WHERE p.id = program_id
            AND (
                p.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM profiles pr
                    WHERE pr.id = auth.uid()
                    AND ('super_admin' = ANY(pr.roles) OR 'program_admin' = ANY(pr.roles))
                )
            )
        ) OR
        -- Assigned reviewers
        EXISTS (
            SELECT 1 FROM review_assignments ra
            JOIN applications a ON a.id = ra.application_id
            WHERE a.program_id = program_id
            AND ra.reviewer_id = auth.uid()
        )
    );

CREATE POLICY "Review criteria manageable by program admins" ON review_criteria
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM programs p
            WHERE p.id = program_id
            AND (
                p.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM profiles pr
                    WHERE pr.id = auth.uid()
                    AND ('super_admin' = ANY(pr.roles) OR 'program_admin' = ANY(pr.roles))
                )
            )
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM programs p
            WHERE p.id = program_id
            AND (
                p.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM profiles pr
                    WHERE pr.id = auth.uid()
                    AND ('super_admin' = ANY(pr.roles) OR 'program_admin' = ANY(pr.roles))
                )
            )
        )
    );

-- Policies for reviewer_expertise
-- Reviewers can manage their own expertise, admins can view all
CREATE POLICY "Reviewer expertise viewable by owner and admins" ON reviewer_expertise
    FOR SELECT USING (
        reviewer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND ('super_admin' = ANY(roles) OR 'program_admin' = ANY(roles))
        )
    );

CREATE POLICY "Reviewers can manage their own expertise" ON reviewer_expertise
    FOR ALL USING (reviewer_id = auth.uid()) 
    WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Admins can verify reviewer expertise" ON reviewer_expertise
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND ('super_admin' = ANY(roles) OR 'program_admin' = ANY(roles))
        )
    );

-- Policies for review_scores
-- Reviewers can only access scores for their own reviews
CREATE POLICY "Review scores viewable by reviewer and admins" ON review_scores
    FOR SELECT USING (
        -- Own reviews
        EXISTS (
            SELECT 1 FROM reviews r
            JOIN review_assignments ra ON r.assignment_id = ra.id
            WHERE r.id = review_id
            AND ra.reviewer_id = auth.uid()
        ) OR
        -- Program admins can view all scores for their programs
        EXISTS (
            SELECT 1 FROM reviews r
            JOIN review_assignments ra ON r.assignment_id = ra.id
            JOIN applications a ON a.id = ra.application_id
            JOIN programs p ON p.id = a.program_id
            WHERE r.id = review_id
            AND (
                p.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM profiles pr
                    WHERE pr.id = auth.uid()
                    AND ('super_admin' = ANY(pr.roles) OR 'program_admin' = ANY(pr.roles))
                )
            )
        )
    );

CREATE POLICY "Review scores manageable by reviewer only" ON review_scores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM reviews r
            JOIN review_assignments ra ON r.assignment_id = ra.id
            WHERE r.id = review_id
            AND ra.reviewer_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM reviews r
            JOIN review_assignments ra ON r.assignment_id = ra.id
            WHERE r.id = review_id
            AND ra.reviewer_id = auth.uid()
        )
    );

-- Create helper function to check if user has program access
CREATE OR REPLACE FUNCTION has_program_access(program_id_param UUID, access_type TEXT DEFAULT 'read')
RETURNS BOOLEAN AS $$
BEGIN
    -- Super admin has access to everything
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND 'super_admin' = ANY(roles)
    ) THEN
        RETURN TRUE;
    END IF;

    -- Program creator has full access
    IF EXISTS (
        SELECT 1 FROM programs 
        WHERE id = program_id_param 
        AND created_by = auth.uid()
    ) THEN
        RETURN TRUE;
    END IF;

    -- Program admin has full access
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND 'program_admin' = ANY(roles)
    ) THEN
        RETURN TRUE;
    END IF;

    -- Reviewers have read access if assigned to program
    IF access_type = 'read' AND EXISTS (
        SELECT 1 FROM review_assignments ra
        JOIN applications a ON a.id = ra.application_id
        WHERE a.program_id = program_id_param
        AND ra.reviewer_id = auth.uid()
    ) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
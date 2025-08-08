-- Migration: Add automatic timestamp update triggers
-- Description: Create triggers to automatically update the updated_at column when records are modified

-- Create a generic function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for all tables with updated_at columns

-- Profiles table
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Programs table
CREATE TRIGGER trigger_programs_updated_at
    BEFORE UPDATE ON programs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Applications table
CREATE TRIGGER trigger_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Reviews table
CREATE TRIGGER trigger_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Announcements table
CREATE TRIGGER trigger_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Notification preferences table
CREATE TRIGGER trigger_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON FUNCTION update_updated_at_column() IS 'Generic trigger function to automatically update updated_at timestamps';
COMMENT ON TRIGGER trigger_profiles_updated_at ON profiles IS 'Automatically updates updated_at when profile is modified';
COMMENT ON TRIGGER trigger_programs_updated_at ON programs IS 'Automatically updates updated_at when program is modified';
COMMENT ON TRIGGER trigger_applications_updated_at ON applications IS 'Automatically updates updated_at when application is modified';
COMMENT ON TRIGGER trigger_reviews_updated_at ON reviews IS 'Automatically updates updated_at when review is modified';
COMMENT ON TRIGGER trigger_announcements_updated_at ON announcements IS 'Automatically updates updated_at when announcement is modified';
COMMENT ON TRIGGER trigger_notification_preferences_updated_at ON notification_preferences IS 'Automatically updates updated_at when notification preferences are modified';
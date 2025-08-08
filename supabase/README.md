# Supabase Setup for Convene

## Database Schema

The database schema includes the following main tables:

### Core Tables
- **profiles** - User profiles extending Supabase auth
- **programs** - Workshop/conference information
- **applications** - User applications to programs
- **documents** - File attachments for applications
- **reviews** - Review scores and feedback
- **participants** - Accepted applicants

### Supporting Tables
- **application_questions** - Custom questions per program
- **review_assignments** - Reviewer-application mapping
- **program_members** - Program admins and instructors
- **announcements** - Bulk messages to participants
- **notification_preferences** - User email settings

## Setup Instructions

### Option 1: Local Development (Requires Docker)

1. Start Docker Desktop
2. Run Supabase locally:
   ```bash
   supabase start
   ```
3. The local Supabase will be available at:
   - API: http://localhost:54321
   - Studio: http://localhost:54323

### Option 2: Hosted Supabase Project

1. Create a project at https://app.supabase.com
2. Run the migrations in your Supabase SQL editor:
   - Copy contents of `migrations/20240101000000_initial_schema.sql`
   - Copy contents of `migrations/20240101000001_rls_policies.sql`
   - Copy contents of `migrations/20240101000002_auth_trigger.sql`
   - Copy contents of `migrations/20240101000003_storage.sql`

3. Get your project credentials:
   - Go to Settings > API
   - Copy the `Project URL` and `anon public` key

4. Create `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## User Roles

The system supports 6 user roles:
- **super_admin** - Full system access
- **program_admin** - Can create and manage programs
- **instructor** - Can view participant data
- **reviewer** - Can review assigned applications
- **applicant** - Can apply to programs
- **participant** - Accepted applicants

## Storage Buckets

Two storage buckets are created:
- **application-documents** - For application file uploads
- **program-materials** - For program resources

## Row Level Security (RLS)

All tables have RLS policies that enforce:
- Users can only see their own data
- Program admins can manage their programs
- Reviewers can only see assigned applications
- Participants can access program materials

## Testing Users

After setting up, create test users through Supabase Auth:
1. Go to Authentication > Users
2. Create users with different roles
3. Update their profiles to assign roles

Example SQL to assign roles:
```sql
UPDATE profiles 
SET roles = ARRAY['program_admin']::user_role[] 
WHERE email = 'admin@example.com';
```
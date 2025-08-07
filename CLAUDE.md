# Convene - Workshop Administration Platform

## Project Overview
Convene is a comprehensive program administration system for managing workshops, symposiums, and conferences. It enables program creation, application management, review workflows, and participant communication.

## Repository
- **GitHub**: https://github.com/shandley/convene

## Technology Stack
- **Framework**: Next.js 14 (App Router) with TypeScript
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth with email verification
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **File Storage**: Supabase Storage
- **Email Service**: Resend
- **Deployment**: Vercel
- **Form Handling**: React Hook Form + Zod
- **Data Fetching**: TanStack Query

## User Roles
1. **Super Admin**: Full system access, user management
2. **Program Admin**: Create and manage programs, assign reviewers, make final decisions
3. **Instructor**: View participant data and analytics for assigned programs
4. **Reviewer**: Access and score assigned applications
5. **Applicant**: Browse programs, submit applications, track status
6. **Participant**: Access program materials post-acceptance

*Note: Users can have multiple roles (e.g., Reviewer for one program, Applicant for another)*

## Core Features (Phase 1 - MVP)

### Program Management
- Create/edit programs with capacity limits
- Set application deadlines and program dates
- Define custom application questions
- Manage waitlist with auto-promotion
- Track registration fees (display only)

### Application System
- Browse available programs
- Save draft applications
- Upload supporting documents (PDF, Word, text)
- Submit before deadline
- Track application status

### Review Workflow
- Assign multiple reviewers per application
- Numerical scoring (1-5) with comments
- Average scores across reviewers
- Optional blind review mode
- Review deadline tracking
- Final decision by Program Admin

### Participant Management
- Auto-promotion from waitlist
- Participant portal with program materials
- Bulk announcements to accepted participants
- Export participant lists

## Database Schema (Key Tables)
- `profiles`: User profiles with roles
- `programs`: Workshop/conference details
- `applications`: Submitted applications with status
- `application_drafts`: Saved draft applications
- `reviews`: Reviewer scores and comments
- `review_assignments`: Reviewer-application mapping
- `documents`: Uploaded files with metadata
- `notifications`: Email queue and history
- `announcements`: Bulk messages to participants

## Security & Compliance
- Row Level Security (RLS) for all database access
- Role-based access control at database level
- GDPR-compliant data retention policies
- Secure file storage with access controls
- Email verification for new accounts

## Email Notifications
- Application received confirmation
- Application status changes
- Review assignment notifications
- Review deadline reminders
- Waitlist promotion alerts
- Program updates and announcements

## Development Phases

### Phase 1 (Current - MVP)
- [x] Requirements gathering
- [x] Tech stack definition
- [ ] Project setup and configuration
- [ ] Database schema and RLS policies
- [ ] Authentication with email verification
- [ ] Program CRUD operations
- [ ] Application submission workflow
- [ ] Review assignment and scoring
- [ ] Basic participant portal

### Phase 2 (Future Enhancements)
- [ ] Application templates
- [ ] Advanced waitlist management
- [ ] Reviewer workload balancing
- [ ] Analytics dashboard
- [ ] Bulk operations
- [ ] API for external integrations
- [ ] Mobile responsive optimization

## File Size Limits
- Individual file: 10MB
- Total per application: 50MB
- Supported formats: PDF, DOCX, DOC, TXT

## Development Commands
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
```

## Success Metrics
- Application submission completion rate > 90%
- Review completion within deadline > 95%
- Page load time < 2 seconds
- User task completion < 5 clicks
- Zero data breaches
# CLAUDE.md Archive
## Archived: 2025-08-08

### Original Detailed Specifications (Moved from main CLAUDE.md)

#### Detailed User Role Descriptions
1. **Super Admin**: Full system access, user management
2. **Program Admin**: Create and manage programs, assign reviewers, make final decisions
3. **Instructor**: View participant data and analytics for assigned programs
4. **Reviewer**: Access and score assigned applications
5. **Applicant**: Browse programs, submit applications, track status
6. **Participant**: Access program materials post-acceptance
*Note: Users can have multiple roles (e.g., Reviewer for one program, Applicant for another)*

#### Complete Feature List (Phase 1 - MVP)
##### Program Management
- Create/edit programs with capacity limits
- Set application deadlines and program dates
- Define custom application questions
- Manage waitlist with auto-promotion
- Track registration fees (display only)

##### Application System
- Browse available programs
- Save draft applications
- Upload supporting documents (PDF, Word, text)
- Submit before deadline
- Track application status

##### Review Workflow
- Assign multiple reviewers per application
- Numerical scoring (1-5) with comments
- Average scores across reviewers
- Optional blind review mode
- Review deadline tracking
- Final decision by Program Admin

##### Participant Management
- Auto-promotion from waitlist
- Participant portal with program materials
- Bulk announcements to accepted participants
- Export participant lists

#### Security & Compliance Details
- Row Level Security (RLS) for all database access
- Role-based access control at database level
- GDPR-compliant data retention policies
- Secure file storage with access controls
- Email verification for new accounts

#### Email Notification Types
- Application received confirmation
- Application status changes
- Review assignment notifications
- Review deadline reminders
- Waitlist promotion alerts
- Program updates and announcements

#### File Size Limits
- Individual file: 10MB
- Total per application: 50MB
- Supported formats: PDF, DOCX, DOC, TXT

#### Success Metrics
- Application submission completion rate > 90%
- Review completion within deadline > 95%
- Page load time < 2 seconds
- User task completion < 5 clicks
- Zero data breaches
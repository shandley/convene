# Convene - Workshop Administration Platform

## Current Status
**Phase 1 - MVP Development**
- ✅ Project setup with Next.js 14, Supabase, shadcn/ui
- ✅ Database schema with RLS policies deployed
- ✅ Basic UI foundation and program creation wizard
- 🔄 Working on: Authentication and core workflows

## Quick Reference
- **Repository**: https://github.com/shandley/convene
- **Stack**: Next.js 14 | Supabase | shadcn/ui | Vercel
- **MCP Servers**: Supabase (DB/Auth) | Vercel (Deployment)

## Active Development Priorities

### Immediate Tasks
1. Complete authentication flow with email verification
2. Implement program CRUD operations
3. Build application submission workflow
4. Create review assignment system

### Current Database Tables
- `profiles`, `programs`, `applications`, `reviews`
- `review_assignments`, `documents`, `participants`
- `announcements`, `notification_preferences`

## Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run type-check   # Run TypeScript checks
npm run lint         # Run linting
```

## Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

## Key Architectural Decisions
- Multi-role system (users can have multiple roles per program)
- RLS-enforced security at database level
- Server components by default (Next.js App Router)
- Form validation with React Hook Form + Zod

## Next Phase (After MVP)
- Analytics dashboard
- Application templates
- API for external integrations
- Mobile optimization

## Notes
- 3 uncommitted changes in working directory
- Supabase project: mfwionbthxrjauwhvwcqw
- Latest commit: "Complete initial setup with Supabase schema and UI foundation"
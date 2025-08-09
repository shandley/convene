# Production Authentication Setup Guide

## Critical Issue Resolved: Auth Callback 404

### Root Cause
The auth callback was returning 404 because:
1. `NEXT_PUBLIC_SITE_URL` was set to `localhost:3000` in production
2. Supabase redirect URLs didn't include Vercel deployment URLs
3. Email confirmations were being generated with incorrect callback URLs

### Solution Implemented

#### 1. Updated URL Handling (`/lib/utils/url.ts`)
Created a utility that automatically detects the correct URL:
- Uses `NEXT_PUBLIC_SITE_URL` if properly configured
- Falls back to Vercel's `NEXT_PUBLIC_VERCEL_URL` (automatically provided)
- Ensures HTTPS protocol and proper formatting

#### 2. Updated Auth Context (`/lib/auth/context.tsx`)
- Now uses `getAuthCallbackURL()` utility instead of hardcoded URL
- Automatically works across all environments (dev, preview, production)

#### 3. Environment Configuration Updates
- Updated `.env.production` with proper documentation
- Removed hardcoded localhost reference
- Added instructions for custom domain setup

### Required Manual Steps

#### A. Configure Supabase Redirect URLs
Go to [Supabase Dashboard → Your Project → Auth → URL Configuration](https://supabase.com/dashboard/project/mfwionthxrjauwhvwcqw/auth/url-configuration) and add:

**Site URL:**
```
https://your-custom-domain.com
```
OR for Vercel default:
```
https://convene-scott-handleys-projects.vercel.app
```

**Additional Redirect URLs:**
```
http://localhost:3000/**
https://*-scott-handleys-projects.vercel.app/**
https://convene-*-scott-handleys-projects.vercel.app/**
```

#### B. Configure Vercel Environment Variables
In [Vercel Dashboard → Your Project → Settings → Environment Variables](https://vercel.com/scott-handleys-projects/convene/settings/environment-variables):

**Required Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://mfwionthxrjauwhvwcqw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1md2lvbnRoeHJqYXV3aHZ3Y3F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2ODI0NzksImV4cCI6MjA3MDI1ODQ3OX0.CYWV1ApvYyyNUIfLdDKMsdM2AmDQMz9RPqj3F9K5i1k
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1md2lvbnRoeHJqYXV3aHZ3Y3F3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDY4MjQ3OSwiZXhwIjoyMDcwMjU4NDc5fQ.nE7fqDi0HSiidzTV41MXtTjTHkMOln0SwBrZ-9JsL-8
```

**Optional (if using custom domain):**
```bash
NEXT_PUBLIC_SITE_URL=https://your-custom-domain.com
```

#### C. Test the Fix
After configuration:
1. Deploy the latest code to Vercel
2. Try signup with a new email address
3. Check email for confirmation link
4. Verify the callback URL uses the correct domain
5. Confirm successful email verification and login

### Technical Details

#### Email Template Variables
Supabase uses these variables in email templates:
- `{{ .ConfirmationURL }}` - Full confirmation URL with token
- `{{ .SiteURL }}` - Your configured Site URL
- `{{ .RedirectTo }}` - The redirect URL from signup
- `{{ .TokenHash }}` - Token hash for manual URL construction

#### URL Wildcards Supported
Supabase supports these wildcard patterns:
- `*` - matches any sequence of non-separator characters
- `**` - matches any sequence of characters (including `/`)
- `?` - matches any single non-separator character

#### Auth Flow Types
The app supports both confirmation methods:
- `/auth/callback` - For code-based verification (current flow)
- `/auth/confirm` - For token_hash-based verification (alternative)

### Verification Checklist

- [ ] Supabase redirect URLs configured with wildcards
- [ ] Vercel environment variables set
- [ ] Code deployed to Vercel
- [ ] Test signup with new email
- [ ] Verify email confirmation works
- [ ] Check production logs for any errors

### Troubleshooting

**If still getting 404:**
1. Check Vercel deployment logs
2. Verify environment variables are set correctly
3. Test the callback URL directly in browser
4. Check Supabase Auth logs

**If email links don't work:**
1. Verify Supabase redirect URLs include your domain
2. Check if email provider is prefetching links
3. Consider switching to OTP-based confirmation

### Next Steps After Resolution
Once auth is working:
1. Test complete user registration flow
2. Implement email verification reminders
3. Add password reset functionality
4. Configure role-based access controls
# Review System API Testing Guide

This guide explains how to properly test the Review Configuration & Scoring System API endpoints with authentication.

## Authentication Overview

The Convene platform uses **Supabase Auth with cookie-based sessions**. Here's how it works:

### Authentication Flow

1. **Frontend Authentication**: Users sign in through the `/auth/login` page
2. **Session Creation**: Supabase creates a JWT session stored in httpOnly cookies
3. **API Requests**: Cookies are automatically sent with requests to API endpoints
4. **Server Verification**: API endpoints call `supabase.auth.getUser()` to verify sessions

### Key Points

- **No API login endpoint**: Authentication happens through Supabase's built-in flow
- **Cookie-based**: Sessions are stored in httpOnly cookies, not headers
- **Automatic refresh**: Supabase handles token refresh automatically
- **RLS integration**: Database queries use Row Level Security policies

## Testing Methods

### 1. Browser-Based Testing (Recommended)

**File**: `test-review-api.html`

This is the most comprehensive testing method that properly handles authentication:

```bash
# Open the HTML tester in your browser
open test-review-api.html
```

**Features**:
- ✅ Full Supabase Auth integration
- ✅ Cookie-based session management
- ✅ Real-time test results
- ✅ JSON response formatting
- ✅ Progress tracking
- ✅ Works with both local and production

**Usage**:
1. Open `test-review-api.html` in your browser
2. Select environment (local/production)
3. Enter credentials: `researcher@university.edu` / `researcher123`
4. Click "Authenticate"
5. Run individual tests or all tests
6. View detailed results and JSON responses

### 2. Command Line Testing (Limited)

**File**: `test-review-endpoints.sh`

Tests endpoint availability and structure without full authentication:

```bash
# Test local endpoints
./test-review-endpoints.sh local

# Test production endpoints  
./test-review-endpoints.sh production
```

**Limitations**:
- ❌ Cannot fully authenticate (Supabase PKCE flow complexity)
- ✅ Tests endpoint availability
- ✅ Checks HTTP status codes
- ✅ Validates endpoint structure

### 3. Manual Testing with Browser DevTools

For debugging specific requests:

1. Sign in to the application normally
2. Open browser DevTools → Network tab
3. Make API requests through the UI
4. Copy curl commands from Network tab
5. Modify and replay requests

## API Endpoints Tested

### Review Settings
- `GET /api/programs/[id]/review-settings` - Retrieve settings
- `POST /api/programs/[id]/review-settings` - Create settings
- `PUT /api/programs/[id]/review-settings` - Update settings
- `DELETE /api/programs/[id]/review-settings` - Delete settings

### Review Criteria
- `GET /api/programs/[id]/review-criteria` - List criteria
- `POST /api/programs/[id]/review-criteria` - Create criteria
- `PUT /api/programs/[id]/review-criteria/[criteriaId]` - Update criteria
- `DELETE /api/programs/[id]/review-criteria/[criteriaId]` - Delete criteria

### Review Templates
- `GET /api/review-templates` - List templates
- `POST /api/review-templates` - Create template
- `POST /api/programs/[id]/apply-template` - Apply template to program

### Review Statistics
- `GET /api/programs/[id]/review-stats` - Get review statistics

## Test Data

The testing system automatically:
1. Uses existing programs or creates test programs
2. Creates sample review criteria and settings
3. Tests CRUD operations
4. Cleans up test data

## Troubleshooting

### Common Issues

#### 405 Method Not Allowed
**Cause**: Trying to access the wrong endpoint or using incorrect HTTP method  
**Solution**: Verify the endpoint exists and supports the HTTP method

#### 401 Unauthorized
**Cause**: Not authenticated or session expired  
**Solution**: 
- Re-authenticate through the browser tester
- Check that cookies are being sent
- Verify user has appropriate permissions

#### 404 Not Found
**Cause**: Endpoint doesn't exist or program ID is invalid  
**Solution**:
- Check API route files exist
- Verify program ID is correct
- Ensure the API server is running

#### CORS Issues
**Cause**: Cross-origin requests blocked  
**Solution**:
- For local testing, ensure API server is running on correct port
- For production, verify CORS configuration

### Authentication Debug

To debug authentication issues:

```javascript
// In browser console after signing in
const { data: session } = await supabase.auth.getSession()
console.log('Current session:', session)

// Test API call
const response = await fetch('/api/programs/test-id/review-settings', {
  credentials: 'include'
})
console.log('API response:', await response.json())
```

### Supabase Auth Status

Check authentication status:

```javascript
// Browser console
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session?.user?.email)
})
```

## Environment Configuration

### Local Development
- API Base: `http://localhost:3000/api`
- Supabase URL: From `.env.local`
- Test with: `npm run dev`

### Production
- API Base: `https://workshop-adminstration-site.vercel.app/api`
- Supabase URL: Production project URL
- Test with: Live deployment

## Test Credentials

**Default Test Account**:
- Email: `researcher@university.edu`
- Password: `researcher123`
- Roles: Multiple roles for comprehensive testing

## Security Considerations

### Authentication Security
- Sessions use httpOnly cookies (XSS protection)
- JWT tokens have proper expiration
- Refresh tokens handle session renewal
- RLS policies enforce data access

### API Security
- All endpoints require authentication
- User permissions checked via Supabase Auth
- Input validation on all POST/PUT requests
- Error messages don't leak sensitive data

## Best Practices

### For Testing
1. Always test both success and error scenarios
2. Verify proper HTTP status codes
3. Check response data structure
4. Test with different user roles
5. Validate input sanitization

### For Development
1. Use the browser tester during development
2. Check Network tab for actual requests
3. Implement proper error handling
4. Add request/response logging
5. Test edge cases (expired sessions, invalid data)

## Next Steps

After setting up authentication testing:

1. **Extend Test Coverage**: Add tests for edge cases and error scenarios
2. **Performance Testing**: Monitor API response times
3. **Integration Testing**: Test full workflow end-to-end  
4. **Load Testing**: Verify performance under load
5. **Security Testing**: Validate security measures

## Files Reference

- `test-review-api.html` - Browser-based comprehensive tester
- `test-review-endpoints.sh` - Command-line endpoint checker
- `test-review-system.js` - Node.js tester (requires packages)
- API routes in `/app/api/programs/[id]/` - Actual endpoint implementations
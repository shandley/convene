# Convene Platform Subagent Guide

This guide provides detailed usage examples for each specialized subagent in the Convene workshop administration platform. Use these agents to accelerate development and maintain consistency across the codebase.

## Quick Reference

| Agent | Specialization | When to Use |
|-------|---------------|-------------|
| `convene-platform-coordinator` | Task orchestration | Start here for complex tasks or when unsure |
| `supabase-database-architect` | Database & migrations | Schema design, RLS policies, SQL optimization |
| `nextjs-convene-builder` | Next.js development | Pages, API routes, server components |
| `supabase-auth-specialist` | Authentication | Login flows, RBAC, session management |
| `shadcn-ui-architect` | UI/UX implementation | Components, layouts, styling |
| `react-form-architect` | Form handling | Complex forms, validation, file uploads |
| `git-workflow-specialist` | Repository management | Commits, branches, PR strategy |

---

## 1. convene-platform-coordinator

The orchestrator that delegates tasks to appropriate specialists.

### Usage Examples

#### Example 1: Complex Feature Request
```
@convene-platform-coordinator I need to implement the ability for program admins to create a new workshop program with custom application questions
```
*The coordinator will orchestrate database design, form creation, UI components, and API routes across multiple agents.*

#### Example 2: Architecture Decision
```
@convene-platform-coordinator What's the best approach to implement email notifications when applications are submitted?
```
*Will analyze requirements and delegate to appropriate specialists for implementation strategy.*

#### Example 3: Bug Investigation
```
@convene-platform-coordinator Users are reporting they can't submit applications after filling out the form. Can you help investigate?
```
*Will coordinate debugging across form validation, API endpoints, and database constraints.*

#### Example 4: Performance Optimization
```
@convene-platform-coordinator The program listing page is loading slowly when there are many programs
```
*Will coordinate database query optimization, caching strategies, and UI rendering improvements.*

---

## 2. supabase-database-architect

Expert in PostgreSQL schemas, migrations, and Supabase-specific features.

### Usage Examples

#### Example 1: Create New Table
```
@supabase-database-architect Create a table for storing review criteria templates that program admins can define for their programs
```
*Will design the schema, write migration SQL, and implement appropriate RLS policies.*

#### Example 2: Add RLS Policy
```
@supabase-database-architect Add RLS policies to ensure reviewers can only see applications assigned to them
```
*Will write comprehensive RLS policies with proper role checking.*

#### Example 3: Optimize Query Performance
```
@supabase-database-architect The query to fetch all applications with their review scores is running slowly. Can you add appropriate indexes?
```
*Will analyze query patterns and create optimized indexes.*

#### Example 4: Database Function
```
@supabase-database-architect Create a database function to automatically promote waitlisted applicants when a spot opens up
```
*Will write a PostgreSQL function with proper triggers.*

#### Example 5: Migration Rollback Strategy
```
@supabase-database-architect I need to modify the programs table but want a safe rollback plan
```
*Will create reversible migrations with proper rollback procedures.*

---

## 3. nextjs-convene-builder

Specialist in Next.js 14 App Router development.

### Usage Examples

#### Example 1: Create Dashboard Page
```
@nextjs-convene-builder Create a dashboard page for program admins showing statistics about their programs
```
*Will build server components with proper data fetching and loading states.*

#### Example 2: API Route Implementation
```
@nextjs-convene-builder Implement an API route for bulk updating application statuses
```
*Will create route handler with proper validation and error handling.*

#### Example 3: Server Action
```
@nextjs-convene-builder Create a server action for submitting program applications that handles file uploads
```
*Will implement server action with multipart form handling.*

#### Example 4: Dynamic Routing
```
@nextjs-convene-builder Set up dynamic routing for program detail pages at /programs/[id]
```
*Will create dynamic route with proper params and metadata.*

#### Example 5: Middleware Implementation
```
@nextjs-convene-builder Add middleware to check user roles before accessing admin routes
```
*Will implement middleware with Supabase session checking.*

---

## 4. supabase-auth-specialist

Expert in authentication flows and role-based access control.

### Usage Examples

#### Example 1: Login Flow
```
@supabase-auth-specialist Implement a login page with email/password and magic link options
```
*Will create complete authentication flow with error handling.*

#### Example 2: Role-Based Protection
```
@supabase-auth-specialist Protect the /admin routes so only users with program_admin or super_admin roles can access them
```
*Will implement RBAC middleware and route protection.*

#### Example 3: Password Reset
```
@supabase-auth-specialist Add password reset functionality with email verification
```
*Will implement secure password reset flow with Supabase Auth.*

#### Example 4: Session Management
```
@supabase-auth-specialist Implement automatic session refresh and handle expired sessions gracefully
```
*Will set up token refresh logic and session persistence.*

#### Example 5: OAuth Integration
```
@supabase-auth-specialist Add Google OAuth login option to the authentication system
```
*Will configure OAuth provider and handle callback flow.*

---

## 5. shadcn-ui-architect

UI/UX implementation specialist using shadcn/ui and Tailwind CSS.

### Usage Examples

#### Example 1: Data Table Component
```
@shadcn-ui-architect Create a data table for displaying applications with sorting, filtering, and pagination
```
*Will build feature-rich data table with shadcn/ui components.*

#### Example 2: Multi-Step Form UI
```
@shadcn-ui-architect Design a multi-step wizard UI for the program creation process
```
*Will create responsive wizard with progress indicators and navigation.*

#### Example 3: Dashboard Layout
```
@shadcn-ui-architect Build a dashboard layout with sidebar navigation for different user roles
```
*Will implement responsive layout with role-based menu items.*

#### Example 4: File Upload Interface
```
@shadcn-ui-architect Create a drag-and-drop file upload component with progress indicators
```
*Will build accessible file upload UI with visual feedback.*

#### Example 5: Notification System UI
```
@shadcn-ui-architect Implement toast notifications and a notification center dropdown
```
*Will create notification components with proper animations and accessibility.*

---

## 6. react-form-architect

Form handling specialist using React Hook Form and Zod.

### Usage Examples

#### Example 1: Application Form
```
@react-form-architect Create an application submission form with dynamic custom questions based on the program
```
*Will build dynamic form with conditional fields and validation.*

#### Example 2: Form Validation Schema
```
@react-form-architect Write Zod schemas for the program creation form with all validation rules
```
*Will create comprehensive type-safe validation schemas.*

#### Example 3: File Upload Handling
```
@react-form-architect Implement file upload in the application form with size and type validation
```
*Will handle file uploads with progress tracking and validation.*

#### Example 4: Auto-Save Functionality
```
@react-form-architect Add auto-save draft functionality to the application form
```
*Will implement debounced auto-save with conflict resolution.*

#### Example 5: Form Array Management
```
@react-form-architect Create a form for managing multiple review criteria with add/remove functionality
```
*Will implement dynamic form arrays with proper validation.*

---

## 7. git-workflow-specialist

Repository management and Git workflow optimization expert.

### Usage Examples

#### Example 1: Repository Analysis
```
@git-workflow-specialist Analyze the current repository status and recommend a commit strategy
```
*Will analyze changes and suggest logical commit boundaries.*

#### Example 2: Branch Strategy
```
@git-workflow-specialist I'm starting work on the review system. What's the best branch strategy?
```
*Will recommend branching approach for feature development.*

#### Example 3: Commit Message
```
@git-workflow-specialist Help me write a proper commit message for the authentication implementation
```
*Will create conventional commit message with proper scope and description.*

#### Example 4: Repository Cleanup
```
@git-workflow-specialist I have several old branches and want to clean up my repository safely
```
*Will analyze branches and recommend safe cleanup strategy.*

#### Example 5: PR Preparation
```
@git-workflow-specialist Help me prepare a pull request for the program management feature
```
*Will organize commits and create comprehensive PR description.*

---

## Best Practices

### 1. Start with the Coordinator
When unsure which agent to use, start with `@convene-platform-coordinator`. It will route your request appropriately.

### 2. Be Specific
Provide clear context and requirements when calling agents:
- ❌ "Create a form"
- ✅ "Create a multi-step form for program creation with validation for dates, capacity, and fees"

### 3. Chain Agents for Complex Tasks
For complex features, use multiple agents in sequence:
1. Database architect for schema
2. Auth specialist for permissions
3. UI architect for interface
4. Form architect for data entry
5. Next.js builder for integration

### 4. Leverage Agent Memory
Agents remember context within a session. Reference previous work:
- "Using the table we just created, add RLS policies..."
- "Now implement the UI for the API route we built..."

### 5. Request Reviews
Ask agents to review existing code:
- "@git-workflow-specialist Review my uncommitted changes and suggest improvements"
- "@supabase-database-architect Review these migrations for potential issues"

---

## Common Workflows

### New Feature Implementation
1. `@convene-platform-coordinator` - Outline the feature requirements
2. `@supabase-database-architect` - Design and implement schema
3. `@nextjs-convene-builder` - Create API routes and pages
4. `@shadcn-ui-architect` - Build UI components
5. `@react-form-architect` - Implement forms if needed
6. `@git-workflow-specialist` - Organize and commit changes

### Bug Fixing
1. `@convene-platform-coordinator` - Analyze the bug report
2. Specific specialist - Fix the issue in their domain
3. `@git-workflow-specialist` - Create fix commit with proper message

### Performance Optimization
1. `@supabase-database-architect` - Optimize queries and indexes
2. `@nextjs-convene-builder` - Implement caching and optimize data fetching
3. `@shadcn-ui-architect` - Optimize rendering and component performance

### Security Enhancement
1. `@supabase-auth-specialist` - Review and enhance authentication
2. `@supabase-database-architect` - Strengthen RLS policies
3. `@nextjs-convene-builder` - Add input validation and sanitization

---

## Tips for Maximum Efficiency

1. **Use agent names with @** - This ensures Claude recognizes you're calling a specific agent
2. **Provide file paths** - When referencing existing code, include file paths
3. **Share error messages** - Include full error messages when debugging
4. **Request explanations** - Ask agents to explain their approach for learning
5. **Batch related tasks** - Group similar requests for the same agent
6. **Review generated code** - Always review agent output before committing

---

## Troubleshooting

### Agent Not Responding as Expected
- Ensure you're using the exact agent name
- Provide more specific context
- Try the coordinator for task routing

### Conflicting Recommendations
- Use the coordinator to resolve conflicts
- Prioritize database and auth decisions
- Consider architectural impact

### Performance Issues
- Start with database optimization
- Then optimize API and data fetching
- Finally optimize UI rendering

---

## Agent Capabilities Matrix

| Task | Primary Agent | Supporting Agents |
|------|--------------|-------------------|
| Create new table | supabase-database-architect | - |
| Build login page | supabase-auth-specialist | shadcn-ui-architect, react-form-architect |
| Add API endpoint | nextjs-convene-builder | supabase-database-architect |
| Create dashboard | shadcn-ui-architect | nextjs-convene-builder |
| Implement form | react-form-architect | shadcn-ui-architect |
| Setup deployment | git-workflow-specialist | nextjs-convene-builder |
| Add RLS policy | supabase-database-architect | supabase-auth-specialist |
| Optimize performance | convene-platform-coordinator | All relevant agents |

---

Remember: These agents are specialized tools designed to accelerate your development. Use them strategically to maintain code quality while building features efficiently.
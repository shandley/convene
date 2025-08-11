# Review Configuration & Scoring System - Production Deployment Guide

**System**: Convene Workshop Administration Platform  
**Implementation Date**: August 10, 2025  
**Database**: Supabase (PostgreSQL)

## 📋 Pre-Deployment Checklist

- [x] ✅ Database schema designed and documented
- [x] ✅ Migration files created and tested
- [x] ✅ RLS policies comprehensive and secure
- [x] ✅ TypeScript types generated
- [x] ✅ Sample data and templates ready
- [x] ✅ Performance indexes optimized
- [x] ✅ Documentation complete

## 🚀 Deployment Steps

### Step 1: Apply Database Migrations

Run the migrations in the following order:

```bash
# 1. Apply core schema
supabase db push --file supabase/migrations/20250810_120000_add_review_configuration_scoring_system.sql

# 2. Apply RLS policies
supabase db push --file supabase/migrations/20250810_120001_add_review_system_rls_policies.sql

# 3. Add sample templates
supabase db push --file supabase/migrations/20250810_120002_add_sample_review_templates.sql

# 4. Add helper functions
supabase db push --file supabase/migrations/20250810_120003_add_review_system_helper_functions.sql
```

### Step 2: Verify Database Schema

```sql
-- Verify all tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'review_%'
ORDER BY table_name;

-- Expected result:
-- review_assignments (existing)
-- review_criteria
-- review_criteria_templates
-- review_scores
-- review_settings
-- reviewer_expertise
-- reviews (existing)

-- Verify ENUM types
SELECT t.typname as enum_name
FROM pg_type t 
WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND t.typname IN ('scoring_type', 'scoring_method', 'expertise_level', 'template_category');
```

### Step 3: Test Sample Data

```sql
-- Check sample templates
SELECT name, category, total_max_score 
FROM review_criteria_templates;

-- Verify functions exist
SELECT proname FROM pg_proc 
WHERE proname IN (
  'calculate_application_weighted_score',
  'get_program_review_stats',
  'auto_assign_reviewers',
  'apply_review_template'
);
```

### Step 4: Update TypeScript Types

```bash
# Generate new types
supabase gen types typescript --project-id mfwionthxrjauwhvwcqw > lib/database.types.ts

# Or use the MCP server
npm run types:generate
```

### Step 5: Test RLS Policies

```sql
-- Test as different user roles
SET ROLE authenticated;

-- Test template access (should work for authenticated users)
SELECT COUNT(*) FROM review_criteria_templates;

-- Test program-specific access (should be restricted)
SELECT COUNT(*) FROM review_settings;
```

## 🔧 Configuration Guide

### Setting Up Review Configuration for a Program

1. **Create Review Settings**:
```sql
INSERT INTO review_settings (
    program_id,
    min_reviews_per_application,
    max_reviews_per_application,
    scoring_method,
    acceptance_threshold,
    rejection_threshold,
    template_id
) VALUES (
    'your-program-id',
    2, -- Minimum 2 reviews per application
    3, -- Maximum 3 reviews per application
    'average', -- Use simple average scoring
    75.0, -- Accept if average score >= 75
    40.0, -- Reject if average score < 40
    'template-id-from-templates-table'
);
```

2. **Apply a Template to Program**:
```sql
SELECT apply_review_template('your-program-id', 'template-id');
```

3. **Create Custom Criteria** (if not using templates):
```sql
INSERT INTO review_criteria (
    program_id,
    name,
    description,
    scoring_type,
    weight,
    max_score,
    min_score,
    sort_order,
    rubric_definition
) VALUES (
    'your-program-id',
    'Technical Skills',
    'Assessment of technical competency',
    'numerical',
    1.5, -- Higher weight for important criteria
    10,
    0,
    1,
    '{
        "10": "Exceptional technical skills",
        "8-9": "Strong technical background",
        "6-7": "Good technical foundation",
        "4-5": "Basic technical skills",
        "2-3": "Limited technical experience",
        "0-1": "Insufficient technical background"
    }'::jsonb
);
```

## 📊 Usage Examples

### Getting Program Review Statistics

```sql
SELECT * FROM get_program_review_stats('program-id');
```

### Assigning Reviewers Automatically

```sql
-- Auto-assign 2 reviewers per application based on expertise
SELECT auto_assign_reviewers('program-id', 2);
```

### Calculating Application Rankings

```sql
SELECT * FROM get_application_ranking('program-id')
ORDER BY rank;
```

### Submitting Review Scores

```sql
-- Insert individual criterion scores
INSERT INTO review_scores (
    review_id,
    criteria_id,
    raw_score,
    rubric_level,
    score_rationale,
    reviewer_confidence
) VALUES (
    'review-id',
    'criteria-id',
    8.5,
    '8-9',
    'Strong technical background with relevant experience',
    85.0
);

-- The trigger will automatically update application average scores
```

## 🛡️ Security Features

### Role-Based Access Control

- **Super Admins**: Full access to all review system data
- **Program Admins**: Access to their programs' review data
- **Program Creators**: Full access to programs they created
- **Reviewers**: Access only to their assigned reviews
- **Others**: No access to review system data

### Data Isolation

- Multi-tenant security with RLS policies
- Program-level data isolation
- Reviewer assignment validation
- Automatic user context detection

### Audit Trail

- All tables include `created_at` and `updated_at` timestamps
- Score changes are tracked with rationale
- Assignment history is maintained
- Decision audit trail in applications table

## 📈 Performance Optimizations

### Database Indexes

- Foreign key indexes on all relationship columns
- Composite indexes for query optimization:
  - `(program_id, sort_order)` on review_criteria
  - `(reviewer_id, expertise_area)` on reviewer_expertise
  - `(review_id, criteria_id)` on review_scores

### Query Optimization

- Function-based calculations with minimal overhead
- Efficient join patterns in helper functions
- Optimized consensus calculation algorithms
- Bulk operation support

## 🚨 Troubleshooting

### Common Issues

1. **Migration Fails**:
   - Check for conflicting table names
   - Verify foreign key relationships exist
   - Ensure user has proper permissions

2. **RLS Policies Block Access**:
   - Verify user roles are set correctly
   - Check if user is authenticated
   - Test with appropriate user context

3. **Functions Don't Execute**:
   - Check function permissions
   - Verify SECURITY DEFINER settings
   - Test with proper parameter types

### Debug Queries

```sql
-- Check current user context
SELECT auth.uid(), auth.role();

-- Verify user roles
SELECT id, email, roles FROM profiles WHERE id = auth.uid();

-- Test RLS policy access
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM review_settings WHERE program_id = 'test-id';

-- Check function execution
SELECT calculate_application_weighted_score('application-id');
```

## 🔄 Rollback Plan

If issues occur, rollback in reverse order:

```sql
-- 1. Drop helper functions
DROP FUNCTION IF EXISTS get_program_review_stats(UUID);
DROP FUNCTION IF EXISTS auto_assign_reviewers(UUID, INTEGER);
-- ... (continue for all functions)

-- 2. Drop sample data
DELETE FROM reviewer_expertise WHERE reviewer_id LIKE '00000000-%';
DELETE FROM review_criteria_templates;

-- 3. Drop RLS policies
DROP POLICY IF EXISTS "Templates are viewable by authenticated users" ON review_criteria_templates;
-- ... (continue for all policies)

-- 4. Drop tables and types
DROP TABLE IF EXISTS review_scores;
DROP TABLE IF EXISTS reviewer_expertise;
DROP TABLE IF EXISTS review_criteria;
DROP TABLE IF EXISTS review_settings;
DROP TABLE IF EXISTS review_criteria_templates;

DROP TYPE IF EXISTS template_category;
DROP TYPE IF EXISTS expertise_level;
DROP TYPE IF EXISTS scoring_method;
DROP TYPE IF EXISTS scoring_type;
```

## 📞 Support and Monitoring

### Health Checks

```sql
-- Monitor review system health
SELECT 
    'review_criteria_templates' as table_name,
    COUNT(*) as record_count,
    COUNT(*) FILTER (WHERE is_active = true) as active_templates
FROM review_criteria_templates
UNION ALL
SELECT 
    'review_settings' as table_name,
    COUNT(*) as record_count,
    COUNT(*) FILTER (WHERE scoring_method = 'average') as average_scoring
FROM review_settings;
```

### Performance Monitoring

```sql
-- Monitor function performance
SELECT 
    schemaname,
    funcname,
    calls,
    total_time,
    mean_time
FROM pg_stat_user_functions 
WHERE funcname LIKE '%review%'
ORDER BY total_time DESC;
```

## ✅ Post-Deployment Verification

After deployment, verify:

1. **Schema Integrity**: All tables and constraints exist
2. **Security**: RLS policies properly restrict access
3. **Functionality**: Helper functions work correctly
4. **Performance**: Queries execute within acceptable time
5. **Data**: Sample templates are available and valid

## 📋 Next Phase Planning

After successful deployment, prepare for:

1. **Frontend Integration**: UI components for review management
2. **Workflow Automation**: Email notifications and reminders
3. **Advanced Analytics**: Reporting dashboards and insights
4. **API Development**: REST endpoints for external integrations

---

**Deployment Status**: ✅ **READY FOR PRODUCTION**

All database components are implemented, tested, and documented. The system is ready for frontend integration and user testing.
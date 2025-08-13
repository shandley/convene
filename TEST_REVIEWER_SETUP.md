# Test Reviewer Setup Instructions

This guide will help you set up a complete test environment for reviewing applications in the Convene workshop administration platform.

## Overview

The test setup creates:
- **1 Test Reviewer Account**: reviewer@test.com (password: reviewer123)
- **3 Test Applicant Accounts**: applicant1@test.com, applicant2@test.com, applicant3@test.com (all with password: applicant123)
- **3 Test Applications**: With varying quality levels (strong, medium, weak candidates)
- **3 Review Assignments**: All assigned to the test reviewer
- **1 Sample Completed Review**: Shows what a finished review looks like
- **Enhanced Application Questions**: Better questions for the Test Conference program

## Setup Steps

### Step 1: Create Authentication Users

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `create-test-reviewer-auth.sql`
4. Click **Run** to execute the script

This creates the authentication records needed for login.

### Step 2: Create Test Data

1. In the same SQL Editor
2. Copy and paste the contents of `test-reviewer-setup.sql`
3. Click **Run** to execute the script

This creates all the profiles, applications, and review assignments.

## Test Credentials

### Test Reviewer Account
- **Email**: reviewer@test.com
- **Password**: reviewer123
- **Role**: reviewer
- **Access**: Can review assigned applications

### Test Applicant Accounts
- **Email**: applicant1@test.com, applicant2@test.com, applicant3@test.com
- **Password**: applicant123 (for all)
- **Role**: applicant
- **Access**: Can view their own applications

## Test Applications Created

### 1. Alice Johnson (Strong Candidate)
- **Background**: Graduate student in Biology with 5+ years experience
- **Statement**: Detailed, professional, shows clear research experience
- **Status**: One review already completed (85/100 score)

### 2. Bob Chen (Medium Candidate)  
- **Background**: Postdoc in Engineering with 2 years ML experience
- **Statement**: Decent motivation, some interdisciplinary interest
- **Status**: Assigned for review, not yet started

### 3. Carol Davis (Weaker Candidate)
- **Background**: Assistant professor in Psychology, limited technical background
- **Statement**: Brief, vague motivation, scheduling concerns
- **Status**: Assigned for review, not yet started

## Testing the Reviewer Workflow

1. **Login as Reviewer**:
   - Use reviewer@test.com / reviewer123
   - Navigate to the reviewer dashboard

2. **View Review Assignments**:
   - See 3 applications assigned for review
   - Review deadline is set to 7 days from now

3. **Review Applications**:
   - Start with Bob Chen's application (medium candidate)
   - Use the scoring criteria to evaluate
   - Leave detailed feedback in strengths/weaknesses

4. **Compare Reviews**:
   - Look at the completed review for Alice Johnson
   - See how scoring and feedback should be structured

## Application Questions Added

The setup also adds these review-friendly questions to the Test Conference program:

1. "Please describe your relevant background and experience."
2. "What are your specific learning goals for this workshop?"
3. "How will you apply what you learn in this workshop?"

## Cleanup

To remove test data later, you can run:

```sql
-- Remove test data (run in Supabase SQL Editor)
DELETE FROM reviews WHERE assignment_id IN (
    SELECT id FROM review_assignments WHERE reviewer_id = '11111111-1111-1111-1111-111111111111'
);
DELETE FROM review_assignments WHERE reviewer_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM applications WHERE applicant_id IN (
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333', 
    '44444444-4444-4444-4444-444444444444'
);
DELETE FROM profiles WHERE email LIKE '%test.com';
DELETE FROM auth.users WHERE email LIKE '%test.com';
```

## Troubleshooting

- **Login Issues**: Make sure both SQL scripts ran successfully
- **No Applications Visible**: Check that the Test Conference program ID is correct in the scripts
- **RLS Errors**: Verify that the reviewer role is properly set in the profiles table

The test environment provides a complete scenario for testing all aspects of the application review workflow.
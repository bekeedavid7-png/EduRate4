# RLS Fix for Evaluation Submissions

## Problem
The evaluation submissions were failing because the Row Level Security (RLS) policies were too restrictive:
- Students could INSERT evaluations but couldn't SELECT their own completed evaluations
- This caused the "Completed Evaluations" section to always show empty

## Solution
Apply the RLS policies from `scripts/005_fix_evaluation_rls.sql` to your Supabase database:

### How to Apply:
1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and run the contents of `scripts/005_fix_evaluation_rls.sql`

### What the fix does:
- **Evaluations table**: Allows students to SELECT their own evaluations (not just INSERT)
- **Evaluation responses table**: Allows students to SELECT their own response data
- Maintains security: Students can only see their own data, admins can see all

## Code Changes Made
✅ Fixed table names to match database schema:
- `student_profiles` → `students`
- `lecturer_courses` → `course_lecturers`
- `is_current` → `is_active`

✅ Updated evaluation form to save to actual database instead of simulating

✅ Fixed TypeScript errors with proper type annotations

✅ Preserved design with:
- Blue-to-indigo gradient background
- Loading spinner on submit button
- Star rating system

## Expected Result After Fix:
1. Student submits evaluation → Data saves to database
2. Student redirected to dashboard
3. "Completed Evaluations" count updates (e.g., Completed (1))
4. Completed evaluation appears in the Completed section on /evaluate page

## Testing
1. Run the SQL fix in Supabase
2. Test evaluation submission
3. Verify completed evaluations appear in the list
4. Check that the count updates correctly

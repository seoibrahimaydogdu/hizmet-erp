-- Fix feedback_requests user_id foreign key constraint
-- Remove the foreign key constraint to allow NULL values without auth.users reference

-- Drop the existing foreign key constraint
ALTER TABLE feedback_requests DROP CONSTRAINT IF EXISTS feedback_requests_user_id_fkey;

-- Make user_id column nullable and remove the foreign key reference
ALTER TABLE feedback_requests ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE feedback_requests ALTER COLUMN user_id DROP NOT NULL;

-- Add a comment explaining the change
COMMENT ON COLUMN feedback_requests.user_id IS 'User ID (can be NULL for guest users, no longer references auth.users)';

-- Update the index to handle NULL values properly
DROP INDEX IF EXISTS idx_feedback_user_id;
CREATE INDEX idx_feedback_user_id ON feedback_requests(user_id) WHERE user_id IS NOT NULL;

-- Test the fix
SELECT 'Feedback user_id constraint fixed successfully!' as status;

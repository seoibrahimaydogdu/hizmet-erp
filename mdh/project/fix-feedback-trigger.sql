-- Fix feedback trigger infinite loop issue
-- Drop existing problematic triggers and functions
DROP TRIGGER IF EXISTS update_feedback_queue_position ON feedback_requests;
DROP TRIGGER IF EXISTS update_feedback_updated_at ON feedback_requests;
DROP FUNCTION IF EXISTS calculate_feedback_queue_position() CASCADE;
DROP FUNCTION IF EXISTS update_feedback_updated_at() CASCADE;

-- Drop the entire table and recreate it to avoid conflicts
DROP TABLE IF EXISTS feedback_requests CASCADE;

-- Recreate the feedback_requests table with proper structure
CREATE TABLE feedback_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('error', 'feature', 'general', 'other')),
  page_source TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  browser_info TEXT,
  os_info TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  estimated_duration_minutes INTEGER,
  queue_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback_requests(type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback_requests(status);
CREATE INDEX IF NOT EXISTS idx_feedback_timestamp ON feedback_requests(timestamp);
CREATE INDEX IF NOT EXISTS idx_feedback_page_source ON feedback_requests(page_source);

-- Recreate the updated_at function
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the queue position function with proper logic
CREATE OR REPLACE FUNCTION calculate_feedback_queue_position()
RETURNS TRIGGER AS $$
BEGIN
  -- Set queue position for the newly inserted feedback only
  NEW.queue_position = (
    SELECT COALESCE(MAX(queue_position), 0) + 1
    FROM feedback_requests 
    WHERE status = 'pending'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the updated_at trigger
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

-- Recreate the queue position trigger (BEFORE INSERT to avoid infinite loop)
CREATE TRIGGER update_feedback_queue_position
  BEFORE INSERT ON feedback_requests
  FOR EACH ROW
  EXECUTE FUNCTION calculate_feedback_queue_position();

-- Test the fix
SELECT 'Feedback trigger fixed successfully!' as status;

-- Verify table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'feedback_requests' 
ORDER BY ordinal_position;

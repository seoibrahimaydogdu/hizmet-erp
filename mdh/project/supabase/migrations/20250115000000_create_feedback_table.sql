-- Create feedback_requests table
CREATE TABLE IF NOT EXISTS feedback_requests (
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

-- Disable RLS for now
-- ALTER TABLE feedback_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies (commented out for now)
-- Users can view their own feedback
-- CREATE POLICY "Users can view own feedback" ON feedback_requests
--   FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own feedback
-- CREATE POLICY "Users can insert own feedback" ON feedback_requests
--   FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own feedback
-- CREATE POLICY "Users can update own feedback" ON feedback_requests
--   FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all feedback
-- CREATE POLICY "Admins can view all feedback" ON feedback_requests
--   FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

-- Function to calculate queue position
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

-- Trigger to update queue positions when feedback is added only
CREATE TRIGGER update_feedback_queue_position
  AFTER INSERT ON feedback_requests
  FOR EACH ROW
  EXECUTE FUNCTION calculate_feedback_queue_position();

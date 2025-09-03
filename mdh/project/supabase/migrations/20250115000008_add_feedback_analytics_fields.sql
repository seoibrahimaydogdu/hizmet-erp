-- Add emotional impact score and tags to feedback_requests table
ALTER TABLE feedback_requests 
ADD COLUMN IF NOT EXISTS emotional_impact_score INTEGER DEFAULT 5 CHECK (emotional_impact_score >= 1 AND emotional_impact_score <= 10),
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index for emotional impact score
CREATE INDEX IF NOT EXISTS idx_feedback_emotional_impact ON feedback_requests(emotional_impact_score);

-- Create index for tags (GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_feedback_tags ON feedback_requests USING GIN(tags);

-- Update existing records with default values
UPDATE feedback_requests 
SET emotional_impact_score = 5, tags = '{}' 
WHERE emotional_impact_score IS NULL OR tags IS NULL;

-- Function to calculate priority score for feedback
CREATE OR REPLACE FUNCTION calculate_feedback_priority_score(
  p_emotional_impact INTEGER,
  p_type TEXT,
  p_page_source TEXT,
  p_tags TEXT[]
) RETURNS INTEGER AS $$
DECLARE
  base_score INTEGER;
  type_multiplier INTEGER;
  source_multiplier INTEGER;
  tag_bonus INTEGER;
BEGIN
  -- Base score from emotional impact (1-10)
  base_score := p_emotional_impact;
  
  -- Type multiplier
  CASE p_type
    WHEN 'error' THEN type_multiplier := 3;
    WHEN 'general' THEN type_multiplier := 2;
    WHEN 'feature' THEN type_multiplier := 1;
    ELSE type_multiplier := 1;
  END CASE;
  
  -- Page source multiplier (critical pages get higher priority)
  CASE 
    WHEN p_page_source ILIKE '%payment%' OR p_page_source ILIKE '%ödeme%' THEN source_multiplier := 3;
    WHEN p_page_source ILIKE '%login%' OR p_page_source ILIKE '%giriş%' THEN source_multiplier := 3;
    WHEN p_page_source ILIKE '%dashboard%' OR p_page_source ILIKE '%ana%' THEN source_multiplier := 2;
    ELSE source_multiplier := 1;
  END CASE;
  
  -- Tag bonus
  tag_bonus := 0;
  IF 'Güvenlik' = ANY(p_tags) THEN tag_bonus := tag_bonus + 2; END IF;
  IF 'Hata' = ANY(p_tags) THEN tag_bonus := tag_bonus + 2; END IF;
  IF 'Ödeme' = ANY(p_tags) THEN tag_bonus := tag_bonus + 1; END IF;
  IF 'Performans' = ANY(p_tags) THEN tag_bonus := tag_bonus + 1; END IF;
  
  -- Calculate final score (max 50)
  RETURN LEAST(base_score * type_multiplier * source_multiplier + tag_bonus, 50);
END;
$$ LANGUAGE plpgsql;

-- Function to get top priority feedback items
CREATE OR REPLACE FUNCTION get_top_priority_feedback(limit_count INTEGER DEFAULT 5)
RETURNS TABLE(
  id UUID,
  subject TEXT,
  message TEXT,
  type TEXT,
  page_source TEXT,
  emotional_impact_score INTEGER,
  tags TEXT[],
  priority_score INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fr.id,
    fr.subject,
    fr.message,
    fr.type,
    fr.page_source,
    fr.emotional_impact_score,
    fr.tags,
    calculate_feedback_priority_score(
      fr.emotional_impact_score, 
      fr.type, 
      fr.page_source, 
      fr.tags
    ) as priority_score,
    fr.created_at
  FROM feedback_requests fr
  WHERE fr.status = 'pending'
  ORDER BY priority_score DESC, fr.created_at ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cluster similar feedback
CREATE OR REPLACE FUNCTION cluster_similar_feedback()
RETURNS TABLE(
  cluster_id INTEGER,
  cluster_title TEXT,
  feedback_count INTEGER,
  avg_emotional_score NUMERIC,
  tags TEXT[],
  priority_score INTEGER,
  sample_subjects TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH feedback_clusters AS (
    SELECT 
      -- Simple clustering based on type and first tag
      ROW_NUMBER() OVER (ORDER BY fr.type, COALESCE(fr.tags[1], 'Diğer')) as cluster_id,
      fr.type,
      COALESCE(fr.tags[1], 'Diğer') as primary_tag,
      COUNT(*) as feedback_count,
      AVG(fr.emotional_impact_score) as avg_emotional_score,
      array_agg(DISTINCT unnest(fr.tags)) as all_tags,
      AVG(calculate_feedback_priority_score(
        fr.emotional_impact_score, 
        fr.type, 
        fr.page_source, 
        fr.tags
      )) as avg_priority_score,
      array_agg(fr.subject) as subjects
    FROM feedback_requests fr
    WHERE fr.status = 'pending'
    GROUP BY fr.type, COALESCE(fr.tags[1], 'Diğer')
  )
  SELECT 
    fc.cluster_id,
    CASE 
      WHEN fc.type = 'error' THEN 'Hata: ' || fc.primary_tag
      WHEN fc.type = 'feature' THEN 'Özellik: ' || fc.primary_tag
      WHEN fc.type = 'general' THEN 'Genel: ' || fc.primary_tag
      ELSE 'Diğer: ' || fc.primary_tag
    END as cluster_title,
    fc.feedback_count,
    ROUND(fc.avg_emotional_score, 1) as avg_emotional_score,
    fc.all_tags as tags,
    ROUND(fc.avg_priority_score) as priority_score,
    fc.subjects[1:3] as sample_subjects
  FROM feedback_clusters fc
  ORDER BY fc.avg_priority_score DESC, fc.feedback_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Akıllı Onboarding ve Eğitim Sistemi
-- Migration: 20250821140000_smart_onboarding_system.sql

-- Eğitim modülleri tablosu
CREATE TABLE IF NOT EXISTS training_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL, -- 'basic', 'advanced', 'admin', 'agent', 'customer'
  difficulty_level integer DEFAULT 1, -- 1-5 arası zorluk seviyesi
  estimated_duration integer DEFAULT 10, -- dakika cinsinden
  prerequisites jsonb DEFAULT '[]', -- Ön koşul modüller
  content jsonb NOT NULL, -- Eğitim içeriği (adımlar, videolar, quizler)
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Kullanıcı eğitim ilerlemesi tablosu
CREATE TABLE IF NOT EXISTS user_training_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  module_id uuid REFERENCES training_modules(id),
  progress_percentage integer DEFAULT 0,
  completed_steps jsonb DEFAULT '[]',
  current_step integer DEFAULT 1,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  time_spent integer DEFAULT 0, -- dakika cinsinden
  score integer DEFAULT 0, -- Quiz skoru
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Eğitim başarı rozetleri tablosu
CREATE TABLE IF NOT EXISTS training_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text, -- Icon URL veya emoji
  category text NOT NULL,
  requirements jsonb NOT NULL, -- Rozet kazanma koşulları
  points integer DEFAULT 0, -- Kazanılan puan
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Kullanıcı rozetleri tablosu
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  badge_id uuid REFERENCES training_badges(id),
  earned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Akıllı ipuçları tablosu
CREATE TABLE IF NOT EXISTS smart_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL, -- 'feature', 'workflow', 'shortcut', 'best_practice'
  trigger_conditions jsonb NOT NULL, -- İpucunun gösterilme koşulları
  priority integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Kullanıcı ipucu geçmişi tablosu
CREATE TABLE IF NOT EXISTS user_tip_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  tip_id uuid REFERENCES smart_tips(id),
  shown_at timestamptz DEFAULT now(),
  was_helpful boolean, -- Kullanıcı geri bildirimi
  created_at timestamptz DEFAULT now()
);

-- Eğitim değerlendirmeleri tablosu
CREATE TABLE IF NOT EXISTS training_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  module_id uuid REFERENCES training_modules(id),
  rating integer NOT NULL, -- 1-5 arası değerlendirme
  feedback text,
  difficulty_rating integer, -- 1-5 arası zorluk değerlendirmesi
  usefulness_rating integer, -- 1-5 arası fayda değerlendirmesi
  created_at timestamptz DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_training_modules_category ON training_modules(category);
CREATE INDEX IF NOT EXISTS idx_user_training_progress_user ON user_training_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_training_progress_module ON user_training_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_training_badges_category ON training_badges(category);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_tips_category ON smart_tips(category);
CREATE INDEX IF NOT EXISTS idx_user_tip_history_user ON user_tip_history(user_id);

-- RLS politikaları
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tip_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_evaluations ENABLE ROW LEVEL SECURITY;

-- Training modules politikaları
CREATE POLICY "Enable read access for all users" ON training_modules FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for authenticated users" ON training_modules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON training_modules FOR UPDATE TO authenticated USING (true);

-- User training progress politikaları
CREATE POLICY "Enable read access for own data" ON user_training_progress FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Enable insert for authenticated users" ON user_training_progress FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for own data" ON user_training_progress FOR UPDATE TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);

-- Training badges politikaları
CREATE POLICY "Enable read access for all users" ON training_badges FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for authenticated users" ON training_badges FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON training_badges FOR UPDATE TO authenticated USING (true);

-- User badges politikaları
CREATE POLICY "Enable read access for own data" ON user_badges FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Enable insert for authenticated users" ON user_badges FOR INSERT TO authenticated WITH CHECK (true);

-- Smart tips politikaları
CREATE POLICY "Enable read access for all users" ON smart_tips FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for authenticated users" ON smart_tips FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON smart_tips FOR UPDATE TO authenticated USING (true);

-- User tip history politikaları
CREATE POLICY "Enable read access for own data" ON user_tip_history FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Enable insert for authenticated users" ON user_tip_history FOR INSERT TO authenticated WITH CHECK (true);

-- Training evaluations politikaları
CREATE POLICY "Enable read access for own data" ON training_evaluations FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Enable insert for authenticated users" ON training_evaluations FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger'ları oluştur
CREATE TRIGGER update_training_modules_updated_at 
  BEFORE UPDATE ON training_modules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_training_progress_updated_at 
  BEFORE UPDATE ON user_training_progress 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_badges_updated_at 
  BEFORE UPDATE ON training_badges 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_smart_tips_updated_at 
  BEFORE UPDATE ON smart_tips 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Akıllı onboarding fonksiyonları
CREATE OR REPLACE FUNCTION get_user_training_progress(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'module_id', utp.module_id,
      'module_name', tm.name,
      'progress_percentage', utp.progress_percentage,
      'is_completed', utp.is_completed,
      'time_spent', utp.time_spent,
      'score', utp.score,
      'started_at', utp.started_at,
      'completed_at', utp.completed_at
    )
  ) INTO result
  FROM user_training_progress utp
  JOIN training_modules tm ON utp.module_id = tm.id
  WHERE utp.user_id = p_user_id;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Kullanıcı için önerilen modülleri getir
CREATE OR REPLACE FUNCTION get_recommended_modules(p_user_id uuid, p_user_role text DEFAULT 'user')
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', tm.id,
      'name', tm.name,
      'description', tm.description,
      'category', tm.category,
      'difficulty_level', tm.difficulty_level,
      'estimated_duration', tm.estimated_duration,
      'progress_percentage', COALESCE(utp.progress_percentage, 0),
      'is_completed', COALESCE(utp.is_completed, false)
    )
  ) INTO result
  FROM training_modules tm
  LEFT JOIN user_training_progress utp ON tm.id = utp.module_id AND utp.user_id = p_user_id
  WHERE tm.is_active = true 
    AND tm.category = p_user_role
    AND (utp.is_completed IS NULL OR utp.is_completed = false)
  ORDER BY tm.difficulty_level ASC, tm.created_at ASC;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Akıllı ipucu getir
CREATE OR REPLACE FUNCTION get_smart_tip(p_user_id uuid, p_context text)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
  tip_record RECORD;
BEGIN
  -- Kullanıcının daha önce gördüğü ipuçlarını hariç tut
  FOR tip_record IN 
    SELECT st.* FROM smart_tips st
    WHERE st.is_active = true
      AND st.category = p_context
      AND st.id NOT IN (
        SELECT tip_id FROM user_tip_history 
        WHERE user_id = p_user_id 
          AND shown_at > now() - INTERVAL '7 days'
      )
    ORDER BY st.priority DESC, random()
    LIMIT 1
  LOOP
    result := json_build_object(
      'id', tip_record.id,
      'title', tip_record.title,
      'content', tip_record.content,
      'category', tip_record.category
    );
    RETURN result;
  END LOOP;
  
  RETURN NULL;
END;
$$;

-- Eğitim ilerlemesini güncelle
CREATE OR REPLACE FUNCTION update_training_progress(
  p_user_id uuid,
  p_module_id uuid,
  p_progress_percentage integer,
  p_current_step integer,
  p_completed_steps jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_training_progress (
    user_id, module_id, progress_percentage, current_step, completed_steps
  ) VALUES (
    p_user_id, p_module_id, p_progress_percentage, p_current_step, p_completed_steps
  )
  ON CONFLICT (user_id, module_id) 
  DO UPDATE SET 
    progress_percentage = p_progress_percentage,
    current_step = p_current_step,
    completed_steps = p_completed_steps,
    updated_at = now();
END;
$$;

-- Başarı rozetlerini kontrol et
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
  badge_record RECORD;
  earned_badges json;
BEGIN
  earned_badges := '[]'::json;
  
  -- Kullanıcının henüz kazanmadığı rozetleri kontrol et
  FOR badge_record IN 
    SELECT tb.* FROM training_badges tb
    WHERE tb.is_active = true
      AND tb.id NOT IN (
        SELECT badge_id FROM user_badges WHERE user_id = p_user_id
      )
  LOOP
    -- Rozet kazanma koşullarını kontrol et
    -- Bu örnekte basit koşullar kullanıyoruz
    IF badge_record.requirements->>'type' = 'completion_count' THEN
      -- Belirli sayıda modül tamamlama rozeti
      IF (
        SELECT COUNT(*) FROM user_training_progress 
        WHERE user_id = p_user_id AND is_completed = true
      ) >= (badge_record.requirements->>'count')::integer THEN
        -- Rozeti ver
        INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, badge_record.id);
        earned_badges := earned_badges || json_build_object(
          'badge_id', badge_record.id,
          'name', badge_record.name,
          'description', badge_record.description,
          'icon', badge_record.icon,
          'points', badge_record.points
        );
      END IF;
    END IF;
  END LOOP;
  
  RETURN earned_badges;
END;
$$;

-- Örnek eğitim modülleri ekle
INSERT INTO training_modules (name, description, category, difficulty_level, estimated_duration, content) VALUES
('Sisteme Hoş Geldiniz', 'Temel sistem kullanımı ve navigasyon', 'basic', 1, 5, 
 '[
   {"type": "welcome", "title": "Hoş Geldiniz", "content": "Sisteme hoş geldiniz! Bu kısa eğitim size temel özellikleri gösterecek."},
   {"type": "navigation", "title": "Navigasyon", "content": "Sol menüden farklı sayfalara erişebilirsiniz."},
   {"type": "search", "title": "Arama", "content": "Üst kısımdaki arama çubuğunu kullanarak hızlı arama yapabilirsiniz."},
   {"type": "quiz", "title": "Kontrol", "questions": [{"question": "Sol menüden hangi sayfalara erişebilirsiniz?", "options": ["Talepler", "Müşteriler", "Raporlar", "Hepsi"], "correct": 3}]}
 ]'),
('Talep Yönetimi', 'Talepleri nasıl oluşturacağınızı ve yöneteceğinizi öğrenin', 'basic', 2, 15,
 '[
   {"type": "overview", "title": "Talep Yönetimi", "content": "Talepler müşteri sorunlarını takip etmenizi sağlar."},
   {"type": "create", "title": "Talep Oluşturma", "content": "Yeni talep oluşturmak için + butonunu kullanın."},
   {"type": "assign", "title": "Talep Atama", "content": "Talepleri temsilcilere atayabilirsiniz."},
   {"type": "status", "title": "Durum Güncelleme", "content": "Talep durumunu güncelleyerek ilerlemeyi takip edin."},
   {"type": "quiz", "title": "Kontrol", "questions": [{"question": "Talep oluşturmak için hangi butonu kullanırsınız?", "options": ["+", "-", "=", "?"], "correct": 0}]}
 ]'),
('Müşteri Yönetimi', 'Müşteri bilgilerini nasıl yöneteceğinizi öğrenin', 'basic', 2, 12,
 '[
   {"type": "overview", "title": "Müşteri Yönetimi", "content": "Müşteri bilgilerini merkezi olarak yönetin."},
   {"type": "profile", "title": "Müşteri Profili", "content": "Her müşterinin detaylı profilini görüntüleyin."},
   {"type": "history", "title": "Geçmiş", "content": "Müşteri geçmişini ve taleplerini inceleyin."},
   {"type": "quiz", "title": "Kontrol", "questions": [{"question": "Müşteri geçmişini nereden görüntüleyebilirsiniz?", "options": ["Profil sayfası", "Ana sayfa", "Ayarlar", "Raporlar"], "correct": 0}]}
 ]');

-- Örnek başarı rozetleri ekle
INSERT INTO training_badges (name, description, icon, category, requirements, points) VALUES
('İlk Adım', 'İlk eğitim modülünü tamamladınız', '🎯', 'basic', '{"type": "completion_count", "count": 1}', 10),
('Öğrenci', '3 eğitim modülünü tamamladınız', '📚', 'basic', '{"type": "completion_count", "count": 3}', 25),
('Uzman', '5 eğitim modülünü tamamladınız', '🏆', 'basic', '{"type": "completion_count", "count": 5}', 50),
('Hızlı Öğrenci', 'Bir günde 2 modül tamamladınız', '⚡', 'achievement', '{"type": "daily_completion", "count": 2}', 30);

-- Örnek akıllı ipuçları ekle
INSERT INTO smart_tips (title, content, category, trigger_conditions, priority) VALUES
('Hızlı Arama', 'Ctrl+F ile sayfa içinde hızlı arama yapabilirsiniz', 'shortcut', '{"page": "any", "action": "search"}', 1),
('Talep Filtreleme', 'Talep listesinde filtreleri kullanarak istediğiniz talepleri bulabilirsiniz', 'workflow', '{"page": "tickets", "action": "view"}', 2),
('Müşteri Ekleme', 'Yeni müşteri eklemek için sağ üstteki + butonunu kullanın', 'feature', '{"page": "customers", "action": "add"}', 1),
('Rapor İndirme', 'Raporları Excel formatında indirebilirsiniz', 'feature', '{"page": "reports", "action": "export"}', 2);

-- Fonksiyon izinleri
GRANT EXECUTE ON FUNCTION get_user_training_progress(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recommended_modules(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_smart_tip(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_training_progress(uuid, uuid, integer, integer, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_award_badges(uuid) TO authenticated;

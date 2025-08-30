-- Akıllı özellikler tabloları

-- Akıllı form asistanı tablosu
CREATE TABLE IF NOT EXISTS form_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  form_type VARCHAR(100) NOT NULL, -- 'ticket', 'customer', 'payment' vb.
  field_name VARCHAR(100) NOT NULL,
  field_value TEXT NOT NULL,
  usage_count INTEGER DEFAULT 1,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Form şablonları tablosu
CREATE TABLE IF NOT EXISTS form_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  form_type VARCHAR(100) NOT NULL,
  template_data JSONB NOT NULL, -- Form yapısı ve varsayılan değerler
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Akıllı onboarding tablosu
CREATE TABLE IF NOT EXISTS training_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content JSONB NOT NULL, -- Modül içeriği
  difficulty_level INTEGER DEFAULT 1, -- 1-5 arası
  estimated_duration INTEGER, -- Dakika cinsinden
  prerequisites JSONB, -- Ön koşul modüller
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kullanıcı eğitim ilerlemesi tablosu
CREATE TABLE IF NOT EXISTS user_training_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  module_id UUID REFERENCES training_modules(id),
  progress_percentage INTEGER DEFAULT 0,
  current_step INTEGER DEFAULT 1,
  completed_steps JSONB DEFAULT '[]', -- Tamamlanan adımlar
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- Eğitim rozetleri tablosu
CREATE TABLE IF NOT EXISTS training_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100), -- İkon dosya adı
  category VARCHAR(100), -- 'beginner', 'intermediate', 'advanced'
  points INTEGER DEFAULT 0, -- Kazanılan puan
  requirements JSONB, -- Rozet kazanma koşulları
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kullanıcı rozetleri tablosu
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  badge_id UUID REFERENCES training_badges(id),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Akıllı ipuçları tablosu
CREATE TABLE IF NOT EXISTS smart_tips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100), -- 'general', 'feature', 'workflow'
  context JSONB, -- Hangi durumlarda gösterileceği
  priority INTEGER DEFAULT 1, -- 1-5 arası öncelik
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kullanıcı ipucu geçmişi tablosu
CREATE TABLE IF NOT EXISTS user_tip_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  tip_id UUID REFERENCES smart_tips(id),
  shown_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  was_helpful BOOLEAN, -- Kullanıcı faydalı buldu mu
  feedback TEXT, -- Kullanıcı geri bildirimi
  UNIQUE(user_id, tip_id)
);

-- Akıllı arama geçmişi tablosu
CREATE TABLE IF NOT EXISTS search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  search_term TEXT NOT NULL,
  search_type VARCHAR(50), -- 'tickets', 'customers', 'messages' vb.
  results_count INTEGER,
  search_filters JSONB, -- Kullanılan filtreler
  clicked_result_id UUID, -- Tıklanan sonuç
  search_duration INTEGER, -- Arama süresi (ms)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Akıllı öneriler tablosu
CREATE TABLE IF NOT EXISTS smart_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  suggestion_type VARCHAR(100), -- 'action', 'reminder', 'tip'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  action_url VARCHAR(500), -- Önerilen aksiyon URL'i
  priority INTEGER DEFAULT 1,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Otomatik raporlar tablosu
CREATE TABLE IF NOT EXISTS auto_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_name VARCHAR(255) NOT NULL,
  report_type VARCHAR(100) NOT NULL, -- 'activity', 'performance', 'engagement'
  schedule_type VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'manual'
  schedule_config JSONB, -- Zamanlama ayarları
  report_config JSONB, -- Rapor parametreleri
  recipients JSONB, -- Alıcı listesi
  is_active BOOLEAN DEFAULT true,
  last_generated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rapor geçmişi tablosu
CREATE TABLE IF NOT EXISTS report_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES auto_reports(id),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  report_data JSONB, -- Rapor verileri
  file_path VARCHAR(500), -- Rapor dosya yolu
  status VARCHAR(50) DEFAULT 'completed', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  generated_by UUID REFERENCES auth.users(id)
);

-- Akıllı uyarılar tablosu
CREATE TABLE IF NOT EXISTS smart_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_name VARCHAR(255) NOT NULL,
  alert_type VARCHAR(100), -- 'threshold', 'anomaly', 'trend'
  conditions JSONB NOT NULL, -- Uyarı koşulları
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Uyarı geçmişi tablosu
CREATE TABLE IF NOT EXISTS alert_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID REFERENCES smart_alerts(id),
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  alert_data JSONB, -- Uyarı verileri
  recipients JSONB, -- Bildirim alanlar
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- Dashboard widget'ları tablosu
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  widget_type VARCHAR(100) NOT NULL, -- 'chart', 'metric', 'list', 'calendar'
  widget_config JSONB NOT NULL, -- Widget ayarları
  position JSONB, -- Widget pozisyonu
  size JSONB, -- Widget boyutu
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS daha sonra ayrı bir migration'da etkinleştirilecek

-- RLS politikaları daha sonra ayrı bir migration'da eklenecek

-- Index'ler daha sonra ayrı bir migration'da eklenecek

-- Trigger'lar daha sonra ayrı bir migration'da eklenecek

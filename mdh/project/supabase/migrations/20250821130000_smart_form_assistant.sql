-- Akıllı Form Doldurma Asistanı
-- Migration: 20250821130000_smart_form_assistant.sql

-- Form şablonları tablosu
CREATE TABLE IF NOT EXISTS form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  form_type text NOT NULL, -- 'customer', 'ticket', 'payment', 'subscription'
  fields jsonb NOT NULL, -- Form alanları ve konfigürasyonları
  validation_rules jsonb DEFAULT '{}',
  auto_complete_rules jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Kullanıcı form geçmişi tablosu
CREATE TABLE IF NOT EXISTS form_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  form_type text NOT NULL,
  field_name text NOT NULL,
  field_value text NOT NULL,
  usage_count integer DEFAULT 1,
  last_used timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Akıllı öneriler tablosu
CREATE TABLE IF NOT EXISTS smart_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_type text NOT NULL, -- 'email', 'phone', 'company', 'address'
  suggestion_value text NOT NULL,
  confidence_score decimal(3,2) DEFAULT 0,
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Form otomasyon kuralları tablosu
CREATE TABLE IF NOT EXISTS form_automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  rule_type text NOT NULL, -- 'auto_fill', 'validation', 'suggestion'
  trigger_field text NOT NULL,
  trigger_value text,
  action_type text NOT NULL, -- 'fill_field', 'show_suggestion', 'validate'
  target_field text,
  action_value text,
  conditions jsonb DEFAULT '{}',
  priority integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_form_history_user_field ON form_history(user_id, field_name);
CREATE INDEX IF NOT EXISTS idx_form_history_form_type ON form_history(form_type);
CREATE INDEX IF NOT EXISTS idx_smart_suggestions_field_type ON smart_suggestions(field_type);
CREATE INDEX IF NOT EXISTS idx_form_automation_rules_trigger ON form_automation_rules(trigger_field);

-- RLS politikaları
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_automation_rules ENABLE ROW LEVEL SECURITY;

-- Form templates politikaları
CREATE POLICY "Enable read access for all users" ON form_templates FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for authenticated users" ON form_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON form_templates FOR UPDATE TO authenticated USING (true);

-- Form history politikaları
CREATE POLICY "Enable read access for own data" ON form_history FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Enable insert for authenticated users" ON form_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for own data" ON form_history FOR UPDATE TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);

-- Smart suggestions politikaları
CREATE POLICY "Enable read access for all users" ON smart_suggestions FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for authenticated users" ON smart_suggestions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON smart_suggestions FOR UPDATE TO authenticated USING (true);

-- Form automation rules politikaları
CREATE POLICY "Enable read access for all users" ON form_automation_rules FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for authenticated users" ON form_automation_rules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON form_automation_rules FOR UPDATE TO authenticated USING (true);

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger'ları oluştur
CREATE TRIGGER update_form_templates_updated_at 
  BEFORE UPDATE ON form_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_history_updated_at 
  BEFORE UPDATE ON form_history 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_smart_suggestions_updated_at 
  BEFORE UPDATE ON smart_suggestions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_automation_rules_updated_at 
  BEFORE UPDATE ON form_automation_rules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Akıllı form asistanı fonksiyonları
CREATE OR REPLACE FUNCTION get_smart_suggestions(p_field_type text, p_search_term text DEFAULT '')
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  suggestions json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', id,
      'value', suggestion_value,
      'confidence', confidence_score,
      'usage_count', usage_count
    )
  ) INTO suggestions
  FROM smart_suggestions
  WHERE field_type = p_field_type 
    AND is_active = true
    AND (p_search_term = '' OR suggestion_value ILIKE '%' || p_search_term || '%')
  ORDER BY confidence_score DESC, usage_count DESC
  LIMIT 10;
  
  RETURN COALESCE(suggestions, '[]'::json);
END;
$$;

-- Form geçmişi kaydetme fonksiyonu
CREATE OR REPLACE FUNCTION save_form_history(p_user_id uuid, p_form_type text, p_field_name text, p_field_value text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO form_history (user_id, form_type, field_name, field_value)
  VALUES (p_user_id, p_form_type, p_field_name, p_field_value)
  ON CONFLICT (user_id, form_type, field_name, field_value) 
  DO UPDATE SET 
    usage_count = form_history.usage_count + 1,
    last_used = now(),
    updated_at = now();
END;
$$;

-- Otomatik form doldurma fonksiyonu
CREATE OR REPLACE FUNCTION auto_fill_form(p_form_type text, p_trigger_field text, p_trigger_value text)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
  rule_record RECORD;
BEGIN
  -- Otomasyon kurallarını kontrol et
  FOR rule_record IN 
    SELECT * FROM form_automation_rules 
    WHERE rule_type = 'auto_fill' 
      AND trigger_field = p_trigger_field 
      AND (trigger_value IS NULL OR trigger_value = p_trigger_value)
      AND is_active = true
    ORDER BY priority DESC
  LOOP
    result := json_build_object(
      'target_field', rule_record.target_field,
      'action_value', rule_record.action_value,
      'rule_name', rule_record.rule_name
    );
    RETURN result;
  END LOOP;
  
  RETURN NULL;
END;
$$;

-- Örnek form şablonları ekle
INSERT INTO form_templates (name, description, form_type, fields, validation_rules, auto_complete_rules) VALUES
('Müşteri Kayıt Formu', 'Yeni müşteri kayıt formu', 'customer', 
 '[
   {"name": "name", "type": "text", "label": "Ad Soyad", "required": true, "auto_complete": true},
   {"name": "email", "type": "email", "label": "E-posta", "required": true, "auto_complete": true},
   {"name": "phone", "type": "tel", "label": "Telefon", "required": false, "auto_complete": true},
   {"name": "company", "type": "text", "label": "Şirket", "required": false, "auto_complete": true},
   {"name": "plan", "type": "select", "label": "Plan", "required": true, "options": ["basic", "pro", "premium"]}
 ]',
 '{
   "email": {"pattern": "^[^@]+@[^@]+\\.[^@]+$", "message": "Geçerli bir e-posta adresi giriniz"},
   "phone": {"pattern": "^[+]?[0-9\\s-]{10,}$", "message": "Geçerli bir telefon numarası giriniz"}
 }',
 '{
   "email": {"suggestions": true, "auto_fill": true},
   "company": {"suggestions": true, "auto_fill": true},
   "phone": {"suggestions": true, "auto_fill": true}
 }'
);

-- Örnek akıllı öneriler ekle
INSERT INTO smart_suggestions (field_type, suggestion_value, confidence_score, usage_count) VALUES
('email', 'ahmet.yilmaz@example.com', 0.9, 15),
('email', 'fatma.demir@example.com', 0.8, 12),
('email', 'mehmet.kaya@example.com', 0.7, 8),
('company', 'TechCorp A.Ş.', 0.9, 20),
('company', 'Digital Solutions Ltd.', 0.8, 15),
('company', 'Innovation Co.', 0.7, 10),
('phone', '+905551234567', 0.9, 18),
('phone', '+905551234568', 0.8, 14),
('phone', '+905551234569', 0.7, 9);

-- Örnek otomasyon kuralları ekle
INSERT INTO form_automation_rules (rule_name, rule_type, trigger_field, trigger_value, action_type, target_field, action_value, priority) VALUES
('Email Domain Company', 'auto_fill', 'email', 'techcorp.com', 'fill_field', 'company', 'TechCorp A.Ş.', 1),
('Email Domain Company', 'auto_fill', 'email', 'digitalsolutions.com', 'fill_field', 'company', 'Digital Solutions Ltd.', 1),
('Premium Plan Auto', 'auto_fill', 'company', 'TechCorp A.Ş.', 'fill_field', 'plan', 'premium', 2),
('Basic Plan Auto', 'auto_fill', 'company', 'StartupHub', 'fill_field', 'plan', 'basic', 2);

-- Fonksiyon izinleri
GRANT EXECUTE ON FUNCTION get_smart_suggestions(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION save_form_history(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_fill_form(text, text, text) TO authenticated;

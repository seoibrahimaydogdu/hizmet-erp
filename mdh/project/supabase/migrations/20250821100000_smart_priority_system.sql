-- Akıllı Talep Önceliklendirme Sistemi
-- Migration: 20250821100000_smart_priority_system.sql

-- Öncelik hesaplama faktörleri tablosu
CREATE TABLE IF NOT EXISTS priority_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factor_name text NOT NULL,
  factor_type text NOT NULL, -- 'business_impact', 'customer_value', 'urgency', 'complexity', 'resource_availability', 'sla_risk'
  weight_percentage integer NOT NULL CHECK (weight_percentage >= 0 AND weight_percentage <= 100),
  calculation_logic jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Öncelik hesaplama geçmişi
CREATE TABLE IF NOT EXISTS priority_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  calculated_priority text NOT NULL,
  confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100),
  factors jsonb NOT NULL, -- Hesaplama detayları
  final_score decimal(5,2),
  calculated_at timestamptz DEFAULT now(),
  calculated_by uuid,
  is_auto_calculated boolean DEFAULT true
);

-- SLA takibi tablosu
CREATE TABLE IF NOT EXISTS sla_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  sla_type text NOT NULL, -- 'response', 'resolution', 'escalation'
  priority_level text NOT NULL, -- 'low', 'medium', 'high', 'urgent', 'critical'
  deadline timestamptz NOT NULL,
  escalation_level integer DEFAULT 1,
  last_escalation timestamptz,
  escalation_history jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Müşteri değer hesaplama tablosu
CREATE TABLE IF NOT EXISTS customer_value_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  total_spent decimal(15,2) DEFAULT 0,
  lifetime_value decimal(15,2) DEFAULT 0,
  satisfaction_score decimal(3,2) DEFAULT 0,
  loyalty_score integer DEFAULT 0, -- 0-100
  risk_score integer DEFAULT 0, -- 0-100 (churn risk)
  value_tier text DEFAULT 'standard', -- 'bronze', 'silver', 'gold', 'platinum', 'vip'
  last_calculation timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Kaynak optimizasyon tablosu
CREATE TABLE IF NOT EXISTS resource_optimization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  current_workload integer DEFAULT 0,
  max_capacity integer DEFAULT 10,
  expertise_areas text[],
  performance_score decimal(3,2) DEFAULT 0,
  availability_status text DEFAULT 'available', -- 'available', 'busy', 'offline', 'training'
  recommended_tickets text[],
  last_optimization timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_priority_calculations_ticket_id ON priority_calculations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_priority_calculations_calculated_at ON priority_calculations(calculated_at);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_ticket_id ON sla_tracking(ticket_id);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_deadline ON sla_tracking(deadline);
CREATE INDEX IF NOT EXISTS idx_customer_value_scores_customer_id ON customer_value_scores(customer_id);
CREATE INDEX IF NOT EXISTS idx_resource_optimization_agent_id ON resource_optimization(agent_id);

-- RLS politikaları
ALTER TABLE priority_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_value_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_optimization ENABLE ROW LEVEL SECURITY;

-- Priority factors politikaları
CREATE POLICY "Enable read access for all users" ON priority_factors FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON priority_factors FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON priority_factors FOR UPDATE TO public USING (true);

-- Priority calculations politikaları
CREATE POLICY "Enable read access for all users" ON priority_calculations FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON priority_calculations FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON priority_calculations FOR UPDATE TO public USING (true);

-- SLA tracking politikaları
CREATE POLICY "Enable read access for all users" ON sla_tracking FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON sla_tracking FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON sla_tracking FOR UPDATE TO public USING (true);

-- Customer value scores politikaları
CREATE POLICY "Enable read access for all users" ON customer_value_scores FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON customer_value_scores FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON customer_value_scores FOR UPDATE TO public USING (true);

-- Resource optimization politikaları
CREATE POLICY "Enable read access for all users" ON resource_optimization FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON resource_optimization FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON resource_optimization FOR UPDATE TO public USING (true);

-- Varsayılan öncelik faktörlerini ekle
INSERT INTO priority_factors (factor_name, factor_type, weight_percentage, calculation_logic) VALUES
('İş Etkisi', 'business_impact', 25, '{"impact_levels": {"none": 1, "low": 2, "medium": 3, "high": 4, "critical": 5}}'),
('Müşteri Değeri', 'customer_value', 20, '{"value_tiers": {"bronze": 1, "silver": 2, "gold": 3, "platinum": 4, "vip": 5}}'),
('Aciliyet', 'urgency', 20, '{"urgency_levels": {"low": 1, "medium": 2, "high": 3, "urgent": 4, "critical": 5}}'),
('Karmaşıklık', 'complexity', 15, '{"complexity_levels": {"simple": 1, "moderate": 2, "complex": 3, "very_complex": 4, "expert": 5}}'),
('Kaynak Uygunluğu', 'resource_availability', 10, '{"availability_levels": {"high": 1, "medium": 2, "low": 3, "none": 4}}'),
('SLA Riski', 'sla_risk', 10, '{"risk_levels": {"none": 1, "low": 2, "medium": 3, "high": 4, "critical": 5}}');

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger'ları oluştur
CREATE TRIGGER update_priority_factors_updated_at 
  BEFORE UPDATE ON priority_factors 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sla_tracking_updated_at 
  BEFORE UPDATE ON sla_tracking 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_value_scores_updated_at 
  BEFORE UPDATE ON customer_value_scores 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_optimization_updated_at 
  BEFORE UPDATE ON resource_optimization 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Akıllı öncelik hesaplama fonksiyonu
CREATE OR REPLACE FUNCTION calculate_smart_priority(p_ticket_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  ticket_record RECORD;
  customer_record RECORD;
  agent_record RECORD;
  factors json;
  final_score decimal(5,2);
  calculated_priority text;
  confidence_score integer;
  business_impact_score integer;
  customer_value_score integer;
  urgency_score integer;
  complexity_score integer;
  resource_score integer;
  sla_risk_score integer;
BEGIN
  -- Talep bilgilerini al
  SELECT * INTO ticket_record FROM tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  -- Müşteri bilgilerini al
  SELECT * INTO customer_record FROM customers WHERE id = ticket_record.customer_id;
  
  -- Temsilci bilgilerini al (eğer atanmışsa)
  agent_record := NULL;
  IF ticket_record.agent_id IS NOT NULL THEN
    SELECT * INTO agent_record FROM agents WHERE id = ticket_record.agent_id;
  END IF;

  -- İş etkisi skoru (kategori ve önceliğe göre)
  business_impact_score := CASE 
    WHEN ticket_record.category = 'technical' THEN 4
    WHEN ticket_record.category = 'billing' THEN 4
    WHEN ticket_record.category = 'urgent' THEN 5
    WHEN ticket_record.priority = 'high' THEN 4
    WHEN ticket_record.priority = 'urgent' THEN 5
    ELSE 2
  END;

  -- Müşteri değeri skoru
  customer_value_score := CASE 
    WHEN customer_record.satisfaction_score >= 9 THEN 5
    WHEN customer_record.satisfaction_score >= 7 THEN 4
    WHEN customer_record.satisfaction_score >= 5 THEN 3
    WHEN customer_record.satisfaction_score >= 3 THEN 2
    ELSE 1
  END;

  -- Aciliyet skoru
  urgency_score := CASE 
    WHEN ticket_record.priority = 'urgent' THEN 5
    WHEN ticket_record.priority = 'high' THEN 4
    WHEN ticket_record.priority = 'medium' THEN 3
    WHEN ticket_record.priority = 'low' THEN 2
    ELSE 1
  END;

  -- Karmaşıklık skoru (kategori bazlı)
  complexity_score := CASE 
    WHEN ticket_record.category = 'technical' THEN 4
    WHEN ticket_record.category = 'billing' THEN 3
    WHEN ticket_record.category = 'general' THEN 2
    ELSE 3
  END;

  -- Kaynak uygunluğu skoru
  resource_score := CASE 
    WHEN ticket_record.agent_id IS NULL THEN 3
    WHEN agent_record IS NULL THEN 3
    WHEN agent_record.status = 'online' THEN 1
    WHEN agent_record.status = 'busy' THEN 2
    WHEN agent_record.status = 'offline' THEN 4
    ELSE 3
  END;

  -- SLA risk skoru
  sla_risk_score := CASE 
    WHEN ticket_record.created_at < NOW() - INTERVAL '24 hours' THEN 5
    WHEN ticket_record.created_at < NOW() - INTERVAL '12 hours' THEN 4
    WHEN ticket_record.created_at < NOW() - INTERVAL '6 hours' THEN 3
    WHEN ticket_record.created_at < NOW() - INTERVAL '2 hours' THEN 2
    ELSE 1
  END;

  -- Final skor hesaplama (ağırlıklı ortalama)
  final_score := (
    business_impact_score * 0.25 +
    customer_value_score * 0.20 +
    urgency_score * 0.20 +
    complexity_score * 0.15 +
    resource_score * 0.10 +
    sla_risk_score * 0.10
  );

  -- Öncelik belirleme
  calculated_priority := CASE 
    WHEN final_score >= 4.5 THEN 'critical'
    WHEN final_score >= 3.5 THEN 'urgent'
    WHEN final_score >= 2.5 THEN 'high'
    WHEN final_score >= 1.5 THEN 'medium'
    ELSE 'low'
  END;

  -- Güven skoru
  confidence_score := GREATEST(70, LEAST(95, 85 + (final_score - 2.5) * 10));

  -- Faktörler JSON'ı
  factors := json_build_object(
    'business_impact', business_impact_score,
    'customer_value', customer_value_score,
    'urgency', urgency_score,
    'complexity', complexity_score,
    'resource_availability', resource_score,
    'sla_risk', sla_risk_score,
    'weights', json_build_object(
      'business_impact', 0.25,
      'customer_value', 0.20,
      'urgency', 0.20,
      'complexity', 0.15,
      'resource_availability', 0.10,
      'sla_risk', 0.10
    )
  );

  -- Sonucu döndür
  RETURN json_build_object(
    'ticket_id', p_ticket_id,
    'calculated_priority', calculated_priority,
    'final_score', final_score,
    'confidence_score', confidence_score,
    'factors', factors
  );
END;
$$;

-- SLA oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_sla_for_ticket(p_ticket_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  ticket_record RECORD;
  priority_result json;
  sla_deadline timestamptz;
BEGIN
  -- Talep bilgilerini al
  SELECT * INTO ticket_record FROM tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Öncelik hesapla
  priority_result := calculate_smart_priority(p_ticket_id);
  
  -- SLA sürelerini belirle
  sla_deadline := CASE 
    WHEN (priority_result->>'calculated_priority') = 'critical' THEN ticket_record.created_at + INTERVAL '2 hours'
    WHEN (priority_result->>'calculated_priority') = 'urgent' THEN ticket_record.created_at + INTERVAL '4 hours'
    WHEN (priority_result->>'calculated_priority') = 'high' THEN ticket_record.created_at + INTERVAL '8 hours'
    WHEN (priority_result->>'calculated_priority') = 'medium' THEN ticket_record.created_at + INTERVAL '24 hours'
    ELSE ticket_record.created_at + INTERVAL '48 hours'
  END;

  -- SLA kaydı oluştur
  INSERT INTO sla_tracking (
    ticket_id,
    sla_type,
    priority_level,
    deadline
  ) VALUES (
    p_ticket_id,
    'response',
    priority_result->>'calculated_priority',
    sla_deadline
  );
END;
$$;

-- Otomatik öncelik hesaplama trigger'ı
CREATE OR REPLACE FUNCTION auto_calculate_priority()
RETURNS TRIGGER AS $$
DECLARE
  priority_result json;
BEGIN
  -- Yeni talep oluşturulduğunda veya güncellendiğinde
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Öncelik hesapla
    priority_result := calculate_smart_priority(NEW.id);
    
    -- Hesaplama sonucunu kaydet
    INSERT INTO priority_calculations (
      ticket_id,
      calculated_priority,
      confidence_score,
      factors,
      final_score,
      is_auto_calculated
    ) VALUES (
      NEW.id,
      priority_result->>'calculated_priority',
      (priority_result->>'confidence_score')::integer,
      priority_result->'factors',
      (priority_result->>'final_score')::decimal,
      true
    );

    -- SLA oluştur
    PERFORM create_sla_for_ticket(NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı oluştur
CREATE TRIGGER trigger_auto_calculate_priority
  AFTER INSERT OR UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION auto_calculate_priority();

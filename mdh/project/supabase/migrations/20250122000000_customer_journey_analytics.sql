/*
  # Müşteri Yolculuğu Analizi Tabloları
  
  Bu migration dosyası müşteri yolculuğu analizi için gerekli tabloları ve fonksiyonları oluşturur.
  Sankey diyagramları ve müşteri yolculuğu analizi için kullanılır.
*/

-- Müşteri yolculuğu aşamaları tablosu
CREATE TABLE IF NOT EXISTS customer_journey_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  stage_name text NOT NULL,
  stage_category text NOT NULL,
  entered_at timestamptz DEFAULT now(),
  exited_at timestamptz,
  duration_minutes integer,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Müşteri yolculuğu geçişleri tablosu
CREATE TABLE IF NOT EXISTS customer_journey_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  from_stage text NOT NULL,
  to_stage text NOT NULL,
  transition_date timestamptz DEFAULT now(),
  transition_reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Müşteri yolculuğu metrikleri tablosu
CREATE TABLE IF NOT EXISTS customer_journey_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metric_date timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Müşteri yolculuğu segmentleri tablosu
CREATE TABLE IF NOT EXISTS customer_journey_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_name text NOT NULL,
  segment_description text,
  criteria jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS politikaları
ALTER TABLE customer_journey_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_journey_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_journey_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_journey_segments ENABLE ROW LEVEL SECURITY;

-- Public erişim politikaları
CREATE POLICY "Enable read access for all users" ON customer_journey_stages
  FOR SELECT TO public USING (true);

CREATE POLICY "Enable insert for all users" ON customer_journey_stages
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON customer_journey_stages
  FOR UPDATE TO public USING (true);

CREATE POLICY "Enable read access for all users" ON customer_journey_transitions
  FOR SELECT TO public USING (true);

CREATE POLICY "Enable insert for all users" ON customer_journey_transitions
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON customer_journey_metrics
  FOR SELECT TO public USING (true);

CREATE POLICY "Enable insert for all users" ON customer_journey_metrics
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON customer_journey_segments
  FOR SELECT TO public USING (true);

CREATE POLICY "Enable insert for all users" ON customer_journey_segments
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON customer_journey_segments
  FOR UPDATE TO public USING (true);

-- Müşteri yolculuğu analizi fonksiyonları

-- Müşteri yolculuğu aşamalarını hesaplayan fonksiyon
CREATE OR REPLACE FUNCTION calculate_customer_journey_stages(
  p_customer_id uuid,
  p_start_date timestamptz DEFAULT (now() - interval '30 days'),
  p_end_date timestamptz DEFAULT now()
)
RETURNS TABLE (
  stage_name text,
  stage_category text,
  entered_at timestamptz,
  exited_at timestamptz,
  duration_minutes integer
) AS $$
BEGIN
  RETURN QUERY
  WITH journey_data AS (
    SELECT 
      'Web Ziyareti' as stage_name,
      'entry' as stage_category,
      c.created_at as entered_at,
      c.created_at + interval '1 hour' as exited_at,
      60 as duration_minutes
    FROM customers c
    WHERE c.id = p_customer_id
      AND c.created_at BETWEEN p_start_date AND p_end_date
    
    UNION ALL
    
    SELECT 
      'Kayıt' as stage_name,
      'conversion' as stage_category,
      c.created_at as entered_at,
      COALESCE(
        (SELECT MIN(t.created_at) FROM tickets t WHERE t.customer_id = c.id),
        c.created_at + interval '1 day'
      ) as exited_at,
      EXTRACT(EPOCH FROM (
        COALESCE(
          (SELECT MIN(t.created_at) FROM tickets t WHERE t.customer_id = c.id),
          c.created_at + interval '1 day'
        ) - c.created_at
      )) / 60 as duration_minutes
    FROM customers c
    WHERE c.id = p_customer_id
      AND c.created_at BETWEEN p_start_date AND p_end_date
    
    UNION ALL
    
    SELECT 
      'İlk Talep' as stage_name,
      'engagement' as stage_category,
      t.created_at as entered_at,
      COALESCE(t.resolved_at, t.created_at + interval '1 day') as exited_at,
      EXTRACT(EPOCH FROM (
        COALESCE(t.resolved_at, t.created_at + interval '1 day') - t.created_at
      )) / 60 as duration_minutes
    FROM tickets t
    WHERE t.customer_id = p_customer_id
      AND t.created_at BETWEEN p_start_date AND p_end_date
      AND t.id = (
        SELECT id FROM tickets t2 
        WHERE t2.customer_id = p_customer_id 
        ORDER BY t2.created_at ASC 
        LIMIT 1
      )
    
    UNION ALL
    
    SELECT 
      'Destek Alımı' as stage_name,
      'support' as stage_category,
      t.created_at as entered_at,
      COALESCE(t.resolved_at, t.created_at + interval '2 days') as exited_at,
      EXTRACT(EPOCH FROM (
        COALESCE(t.resolved_at, t.created_at + interval '2 days') - t.created_at
      )) / 60 as duration_minutes
    FROM tickets t
    WHERE t.customer_id = p_customer_id
      AND t.created_at BETWEEN p_start_date AND p_end_date
      AND t.status IN ('resolved', 'closed')
    
    UNION ALL
    
    SELECT 
      'Ödeme' as stage_name,
      'revenue' as stage_category,
      p.payment_date as entered_at,
      p.payment_date + interval '1 hour' as exited_at,
      60 as duration_minutes
    FROM payments p
    WHERE p.customer_id = p_customer_id
      AND p.payment_date BETWEEN p_start_date AND p_end_date
      AND p.status IN ('completed', 'paid')
    
    UNION ALL
    
    SELECT 
      'Abonelik' as stage_name,
      'retention' as stage_category,
      s.created_at as entered_at,
      COALESCE(s.ends_at, s.created_at + interval '1 month') as exited_at,
      EXTRACT(EPOCH FROM (
        COALESCE(s.ends_at, s.created_at + interval '1 month') - s.created_at
      )) / 60 as duration_minutes
    FROM subscriptions s
    WHERE s.customer_id = p_customer_id
      AND s.created_at BETWEEN p_start_date AND p_end_date
      AND s.status = 'active'
    
    UNION ALL
    
    SELECT 
      'Memnuniyet' as stage_name,
      'satisfaction' as stage_category,
      t.resolved_at as entered_at,
      t.resolved_at + interval '1 day' as exited_at,
      1440 as duration_minutes
    FROM tickets t
    WHERE t.customer_id = p_customer_id
      AND t.resolved_at BETWEEN p_start_date AND p_end_date
      AND t.satisfaction_rating >= 4
    
    UNION ALL
    
    SELECT 
      'Tekrar Ziyaret' as stage_name,
      'loyalty' as stage_category,
      t.created_at as entered_at,
      t.created_at + interval '1 day' as exited_at,
      1440 as duration_minutes
    FROM tickets t
    WHERE t.customer_id = p_customer_id
      AND t.created_at BETWEEN p_start_date AND p_end_date
      AND t.id IN (
        SELECT id FROM tickets t2 
        WHERE t2.customer_id = p_customer_id 
        ORDER BY t2.created_at ASC 
        OFFSET 1
      )
  )
  SELECT 
    jd.stage_name,
    jd.stage_category,
    jd.entered_at,
    jd.exited_at,
    jd.duration_minutes::integer
  FROM journey_data jd
  ORDER BY jd.entered_at;
END;
$$ LANGUAGE plpgsql;

-- Müşteri yolculuğu geçişlerini hesaplayan fonksiyon
CREATE OR REPLACE FUNCTION calculate_customer_journey_transitions(
  p_start_date timestamptz DEFAULT (now() - interval '30 days'),
  p_end_date timestamptz DEFAULT now()
)
RETURNS TABLE (
  from_stage text,
  to_stage text,
  transition_count bigint,
  transition_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH stage_sequence AS (
    SELECT 
      c.id as customer_id,
      'Web Ziyareti' as stage_name,
      c.created_at as stage_date,
      1 as stage_order
    FROM customers c
    WHERE c.created_at BETWEEN p_start_date AND p_end_date
    
    UNION ALL
    
    SELECT 
      c.id as customer_id,
      'Kayıt' as stage_name,
      c.created_at as stage_date,
      2 as stage_order
    FROM customers c
    WHERE c.created_at BETWEEN p_start_date AND p_end_date
    
    UNION ALL
    
    SELECT 
      t.customer_id,
      'İlk Talep' as stage_name,
      t.created_at as stage_date,
      3 as stage_order
    FROM tickets t
    WHERE t.created_at BETWEEN p_start_date AND p_end_date
      AND t.id = (
        SELECT id FROM tickets t2 
        WHERE t2.customer_id = t.customer_id 
        ORDER BY t2.created_at ASC 
        LIMIT 1
      )
    
    UNION ALL
    
    SELECT 
      t.customer_id,
      'Destek Alımı' as stage_name,
      t.created_at as stage_date,
      4 as stage_order
    FROM tickets t
    WHERE t.created_at BETWEEN p_start_date AND p_end_date
      AND t.status IN ('resolved', 'closed')
    
    UNION ALL
    
    SELECT 
      p.customer_id,
      'Ödeme' as stage_name,
      p.payment_date as stage_date,
      5 as stage_order
    FROM payments p
    WHERE p.payment_date BETWEEN p_start_date AND p_end_date
      AND p.status IN ('completed', 'paid')
    
    UNION ALL
    
    SELECT 
      s.customer_id,
      'Abonelik' as stage_name,
      s.created_at as stage_date,
      6 as stage_order
    FROM subscriptions s
    WHERE s.created_at BETWEEN p_start_date AND p_end_date
      AND s.status = 'active'
    
    UNION ALL
    
    SELECT 
      t.customer_id,
      'Memnuniyet' as stage_name,
      t.resolved_at as stage_date,
      7 as stage_order
    FROM tickets t
    WHERE t.resolved_at BETWEEN p_start_date AND p_end_date
      AND t.satisfaction_rating >= 4
    
    UNION ALL
    
    SELECT 
      t.customer_id,
      'Tekrar Ziyaret' as stage_name,
      t.created_at as stage_date,
      8 as stage_order
    FROM tickets t
    WHERE t.created_at BETWEEN p_start_date AND p_end_date
      AND t.id IN (
        SELECT id FROM tickets t2 
        WHERE t2.customer_id = t.customer_id 
        ORDER BY t2.created_at ASC 
        OFFSET 1
      )
  ),
  customer_journeys AS (
    SELECT 
      customer_id,
      stage_name,
      stage_date,
      stage_order,
      LAG(stage_name) OVER (PARTITION BY customer_id ORDER BY stage_order) as prev_stage
    FROM stage_sequence
    ORDER BY customer_id, stage_order
  ),
  transitions AS (
    SELECT 
      COALESCE(prev_stage, 'Başlangıç') as from_stage,
      stage_name as to_stage,
      COUNT(*) as transition_count
    FROM customer_journeys
    WHERE prev_stage IS NOT NULL
    GROUP BY prev_stage, stage_name
  )
  SELECT 
    t.from_stage,
    t.to_stage,
    t.transition_count,
    ROUND(
      (t.transition_count::numeric / SUM(t.transition_count) OVER (PARTITION BY t.from_stage)) * 100, 
      2
    ) as transition_rate
  FROM transitions t
  ORDER BY t.from_stage, t.transition_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Müşteri yolculuğu metriklerini hesaplayan fonksiyon
CREATE OR REPLACE FUNCTION calculate_customer_journey_metrics(
  p_start_date timestamptz DEFAULT (now() - interval '30 days'),
  p_end_date timestamptz DEFAULT now()
)
RETURNS TABLE (
  metric_name text,
  metric_value numeric,
  metric_description text
) AS $$
BEGIN
  RETURN QUERY
  WITH base_metrics AS (
    SELECT 
      COUNT(DISTINCT c.id) as total_customers,
      COUNT(DISTINCT CASE WHEN c.created_at BETWEEN p_start_date AND p_end_date THEN c.id END) as new_customers,
      COUNT(DISTINCT t.customer_id) as customers_with_tickets,
      COUNT(DISTINCT p.customer_id) as customers_with_payments,
      COUNT(DISTINCT s.customer_id) as customers_with_subscriptions,
      AVG(CASE WHEN t.satisfaction_rating IS NOT NULL THEN t.satisfaction_rating END) as avg_satisfaction,
      COUNT(DISTINCT CASE WHEN t.created_at BETWEEN p_start_date AND p_end_date THEN t.customer_id END) as customers_with_recent_tickets
    FROM customers c
    LEFT JOIN tickets t ON c.id = t.customer_id
    LEFT JOIN payments p ON c.id = p.customer_id AND p.status IN ('completed', 'paid')
    LEFT JOIN subscriptions s ON c.id = s.customer_id AND s.status = 'active'
    WHERE c.created_at <= p_end_date
  )
  SELECT 
    'total_customers'::text as metric_name,
    bm.total_customers::numeric as metric_value,
    'Toplam müşteri sayısı'::text as metric_description
  FROM base_metrics bm
  
  UNION ALL
  
  SELECT 
    'new_customers'::text as metric_name,
    bm.new_customers::numeric as metric_value,
    'Yeni müşteri sayısı'::text as metric_description
  FROM base_metrics bm
  
  UNION ALL
  
  SELECT 
    'conversion_rate'::text as metric_name,
    CASE 
      WHEN bm.total_customers > 0 THEN (bm.customers_with_tickets::numeric / bm.total_customers) * 100
      ELSE 0
    END as metric_value,
    'Talep oluşturma dönüşüm oranı'::text as metric_description
  FROM base_metrics bm
  
  UNION ALL
  
  SELECT 
    'payment_conversion_rate'::text as metric_name,
    CASE 
      WHEN bm.customers_with_tickets > 0 THEN (bm.customers_with_payments::numeric / bm.customers_with_tickets) * 100
      ELSE 0
    END as metric_value,
    'Ödeme dönüşüm oranı'::text as metric_description
  FROM base_metrics bm
  
  UNION ALL
  
  SELECT 
    'subscription_conversion_rate'::text as metric_name,
    CASE 
      WHEN bm.customers_with_payments > 0 THEN (bm.customers_with_subscriptions::numeric / bm.customers_with_payments) * 100
      ELSE 0
    END as metric_value,
    'Abonelik dönüşüm oranı'::text as metric_description
  FROM base_metrics bm
  
  UNION ALL
  
  SELECT 
    'avg_satisfaction'::text as metric_name,
    COALESCE(bm.avg_satisfaction, 0)::numeric as metric_value,
    'Ortalama memnuniyet skoru'::text as metric_description
  FROM base_metrics bm
  
  UNION ALL
  
  SELECT 
    'retention_rate'::text as metric_name,
    CASE 
      WHEN bm.total_customers > 0 THEN (bm.customers_with_recent_tickets::numeric / bm.total_customers) * 100
      ELSE 0
    END as metric_value,
    'Müşteri tutma oranı'::text as metric_description
  FROM base_metrics bm;
END;
$$ LANGUAGE plpgsql;

-- Örnek müşteri yolculuğu segmentleri
INSERT INTO customer_journey_segments (segment_name, segment_description, criteria) VALUES
('Yeni Müşteriler', 'Son 30 gün içinde kayıt olan müşteriler', '{"created_at": {"$gte": "30 days ago"}}'),
('Aktif Müşteriler', 'Son 7 gün içinde talep oluşturan müşteriler', '{"last_ticket_date": {"$gte": "7 days ago"}}'),
('VIP Müşteriler', '1000 TL üzerinde ödeme yapan müşteriler', '{"total_spent": {"$gte": 1000}}'),
('Riskli Müşteriler', 'Son 30 gün içinde talep oluşturmayan müşteriler', '{"last_ticket_date": {"$lt": "30 days ago"}}'),
('Memnun Müşteriler', 'Ortalama memnuniyet skoru 4 ve üzeri olan müşteriler', '{"avg_satisfaction": {"$gte": 4}}')
ON CONFLICT DO NOTHING;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_customer_journey_stages_customer_id ON customer_journey_stages(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_journey_stages_stage_name ON customer_journey_stages(stage_name);
CREATE INDEX IF NOT EXISTS idx_customer_journey_stages_entered_at ON customer_journey_stages(entered_at);

CREATE INDEX IF NOT EXISTS idx_customer_journey_transitions_customer_id ON customer_journey_transitions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_journey_transitions_from_stage ON customer_journey_transitions(from_stage);
CREATE INDEX IF NOT EXISTS idx_customer_journey_transitions_to_stage ON customer_journey_transitions(to_stage);

CREATE INDEX IF NOT EXISTS idx_customer_journey_metrics_customer_id ON customer_journey_metrics(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_journey_metrics_metric_name ON customer_journey_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_customer_journey_metrics_metric_date ON customer_journey_metrics(metric_date);

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_customer_journey_on_ticket_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Yeni talep oluşturulduğunda
  IF TG_OP = 'INSERT' THEN
    INSERT INTO customer_journey_stages (customer_id, stage_name, stage_category, metadata)
    VALUES (NEW.customer_id, 'İlk Talep', 'engagement', 
            jsonb_build_object('ticket_id', NEW.id, 'ticket_title', NEW.title));
    
    INSERT INTO customer_journey_transitions (customer_id, from_stage, to_stage, transition_reason)
    VALUES (NEW.customer_id, 'Kayıt', 'İlk Talep', 'İlk talep oluşturuldu');
    
    RETURN NEW;
  END IF;
  
  -- Talep çözüldüğünde
  IF TG_OP = 'UPDATE' AND OLD.status != 'resolved' AND NEW.status = 'resolved' THEN
    INSERT INTO customer_journey_stages (customer_id, stage_name, stage_category, metadata)
    VALUES (NEW.customer_id, 'Destek Alımı', 'support', 
            jsonb_build_object('ticket_id', NEW.id, 'resolution_time', 
                              EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.created_at)) / 3600));
    
    INSERT INTO customer_journey_transitions (customer_id, from_stage, to_stage, transition_reason)
    VALUES (NEW.customer_id, 'İlk Talep', 'Destek Alımı', 'Talep çözüldü');
    
    -- Memnuniyet skoru varsa
    IF NEW.satisfaction_rating >= 4 THEN
      INSERT INTO customer_journey_stages (customer_id, stage_name, stage_category, metadata)
      VALUES (NEW.customer_id, 'Memnuniyet', 'satisfaction', 
              jsonb_build_object('ticket_id', NEW.id, 'satisfaction_rating', NEW.satisfaction_rating));
      
      INSERT INTO customer_journey_transitions (customer_id, from_stage, to_stage, transition_reason)
      VALUES (NEW.customer_id, 'Destek Alımı', 'Memnuniyet', 'Yüksek memnuniyet skoru');
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ları oluştur
DROP TRIGGER IF EXISTS trigger_update_customer_journey_on_ticket_change ON tickets;
CREATE TRIGGER trigger_update_customer_journey_on_ticket_change
  AFTER INSERT OR UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_journey_on_ticket_change();

-- Ödeme trigger'ı
CREATE OR REPLACE FUNCTION update_customer_journey_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status IN ('completed', 'paid') THEN
    INSERT INTO customer_journey_stages (customer_id, stage_name, stage_category, metadata)
    VALUES (NEW.customer_id, 'Ödeme', 'revenue', 
            jsonb_build_object('payment_id', NEW.id, 'amount', NEW.amount, 'payment_method', NEW.payment_method));
    
    INSERT INTO customer_journey_transitions (customer_id, from_stage, to_stage, transition_reason)
    VALUES (NEW.customer_id, 'Destek Alımı', 'Ödeme', 'Ödeme tamamlandı');
    
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customer_journey_on_payment ON payments;
CREATE TRIGGER trigger_update_customer_journey_on_payment
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_journey_on_payment();

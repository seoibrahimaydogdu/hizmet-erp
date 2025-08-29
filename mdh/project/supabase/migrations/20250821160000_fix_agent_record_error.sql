-- Agent record hatası düzeltmesi
-- Migration: 20250821160000_fix_agent_record_error.sql

-- calculate_smart_priority fonksiyonunu güncelle
CREATE OR REPLACE FUNCTION calculate_smart_priority(p_ticket_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  ticket_record RECORD;
  customer_record RECORD;
  agent_exists boolean := false;
  agent_status text := null;
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
  
  -- Temsilci durumunu kontrol et (agent_record kullanmadan)
  IF ticket_record.agent_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM agents WHERE id = ticket_record.agent_id) INTO agent_exists;
    IF agent_exists THEN
      SELECT status INTO agent_status FROM agents WHERE id = ticket_record.agent_id;
    END IF;
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

  -- Kaynak uygunluğu skoru (güvenli şekilde)
  resource_score := CASE 
    WHEN ticket_record.agent_id IS NULL THEN 3
    WHEN NOT agent_exists THEN 3
    WHEN agent_status = 'online' THEN 1
    WHEN agent_status = 'busy' THEN 2
    WHEN agent_status = 'offline' THEN 4
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

-- Akıllı Özellikler için Veritabanı Tabloları
-- Bu migration, yeni eklenen akıllı özellikler için gerekli tabloları oluşturur

-- Ödeme Planları Tablosu
CREATE TABLE IF NOT EXISTS payment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES payments(id) ON DELETE CASCADE,
  total_amount decimal(15,2) NOT NULL,
  remaining_amount decimal(15,2) NOT NULL,
  installment_count integer NOT NULL,
  current_installment integer DEFAULT 0,
  installment_amount decimal(15,2) NOT NULL,
  start_date timestamptz NOT NULL,
  next_due_date timestamptz NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'overdue', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Hatırlatma Planları Tablosu
CREATE TABLE IF NOT EXISTS reminder_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  payment_plan_id uuid REFERENCES payment_plans(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES payments(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('email', 'sms', 'push', 'in_app')),
  reminder_date timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  message_template text NOT NULL,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Sohbet Geçmişi ve Transcript Tablosu
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  session_duration integer, -- dakika cinsinden
  message_count integer DEFAULT 0,
  agent_name text,
  tags text[],
  rating integer CHECK (rating >= 1 AND rating <= 5),
  summary text,
  transcript_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Öncelik Analizi Geçmişi
CREATE TABLE IF NOT EXISTS priority_analysis_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  original_priority text,
  suggested_priority text,
  confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100),
  reasoning text,
  analysis_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Müşteri Davranış Analizi
CREATE TABLE IF NOT EXISTS customer_behavior_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  behavior_type text NOT NULL, -- 'priority_preference', 'payment_pattern', 'support_frequency'
  behavior_data jsonb NOT NULL,
  confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at timestamptz DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_payment_plans_customer_id ON payment_plans(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_status ON payment_plans(status);
CREATE INDEX IF NOT EXISTS idx_payment_plans_next_due_date ON payment_plans(next_due_date);

CREATE INDEX IF NOT EXISTS idx_reminder_schedules_customer_id ON reminder_schedules(customer_id);
CREATE INDEX IF NOT EXISTS idx_reminder_schedules_reminder_date ON reminder_schedules(reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminder_schedules_status ON reminder_schedules(status);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_ticket_id ON chat_sessions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_priority_analysis_customer_id ON priority_analysis_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_priority_analysis_ticket_id ON priority_analysis_history(ticket_id);

CREATE INDEX IF NOT EXISTS idx_customer_behavior_customer_id ON customer_behavior_analytics(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_behavior_type ON customer_behavior_analytics(behavior_type);

-- RLS Politikaları
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority_analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_behavior_analytics ENABLE ROW LEVEL SECURITY;

-- Payment Plans politikaları
CREATE POLICY "Enable read access for all users" ON payment_plans FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON payment_plans FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON payment_plans FOR UPDATE TO public USING (true);

-- Reminder Schedules politikaları
CREATE POLICY "Enable read access for all users" ON reminder_schedules FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON reminder_schedules FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON reminder_schedules FOR UPDATE TO public USING (true);

-- Chat Sessions politikaları
CREATE POLICY "Enable read access for all users" ON chat_sessions FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON chat_sessions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON chat_sessions FOR UPDATE TO public USING (true);

-- Priority Analysis History politikaları
CREATE POLICY "Enable read access for all users" ON priority_analysis_history FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON priority_analysis_history FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON priority_analysis_history FOR UPDATE TO public USING (true);

-- Customer Behavior Analytics politikaları
CREATE POLICY "Enable read access for all users" ON customer_behavior_analytics FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON customer_behavior_analytics FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON customer_behavior_analytics FOR UPDATE TO public USING (true);

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_payment_plan_remaining()
RETURNS TRIGGER AS $$
BEGIN
  -- Ödeme planı güncellendiğinde kalan tutarı hesapla
  IF NEW.current_installment > OLD.current_installment THEN
    NEW.remaining_amount := NEW.total_amount - (NEW.current_installment * NEW.installment_amount);
    
    -- Eğer tüm taksitler ödendiyse durumu tamamlandı olarak işaretle
    IF NEW.current_installment >= NEW.installment_count THEN
      NEW.status := 'completed';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_plan_remaining
  BEFORE UPDATE ON payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_plan_remaining();

-- Otomatik hatırlatma gönderme fonksiyonu
CREATE OR REPLACE FUNCTION send_payment_reminders()
RETURNS void AS $$
DECLARE
  reminder_record RECORD;
BEGIN
  -- Gönderilmemiş ve zamanı gelmiş hatırlatmaları bul
  FOR reminder_record IN 
    SELECT * FROM reminder_schedules 
    WHERE status = 'pending' 
    AND reminder_date <= now()
  LOOP
    -- Burada gerçek e-posta/SMS gönderme işlemi yapılır
    -- Şimdilik sadece durumu güncelliyoruz
    UPDATE reminder_schedules 
    SET status = 'sent', sent_at = now()
    WHERE id = reminder_record.id;
    
    -- Log kaydı
    INSERT INTO system_logs (action, details, created_at)
    VALUES ('reminder_sent', jsonb_build_object('reminder_id', reminder_record.id, 'customer_id', reminder_record.customer_id), now());
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Örnek veriler - Mevcut verileri kullanarak
DO $$
DECLARE
    customer1_id uuid;
    customer2_id uuid;
    customer3_id uuid;
    payment1_id uuid;
    payment2_id uuid;
    ticket1_id uuid;
    ticket2_id uuid;
    payment_plan1_id uuid;
    payment_plan2_id uuid;
BEGIN
    -- Mevcut müşterileri al
    SELECT id INTO customer1_id FROM customers WHERE email = 'ahmet@example.com' LIMIT 1;
    SELECT id INTO customer2_id FROM customers WHERE email = 'ayse@example.com' LIMIT 1;
    SELECT id INTO customer3_id FROM customers WHERE email = 'mehmet@example.com' LIMIT 1;
    
    -- Eğer müşteriler yoksa, test müşterilerini kullan
    IF customer1_id IS NULL THEN
        SELECT id INTO customer1_id FROM customers WHERE email = 'test-try@example.com' LIMIT 1;
    END IF;
    IF customer2_id IS NULL THEN
        SELECT id INTO customer2_id FROM customers WHERE email = 'test-usd@example.com' LIMIT 1;
    END IF;
    IF customer3_id IS NULL THEN
        SELECT id INTO customer3_id FROM customers WHERE email = 'test-eur@example.com' LIMIT 1;
    END IF;
    
    -- Örnek ödemeler oluştur (eğer yoksa)
    INSERT INTO payments (customer_id, amount, currency, status, description, payment_method, invoice_number, created_at)
    VALUES 
        (customer1_id, 1500.00, 'TRY', 'completed', 'Aylık abonelik ödemesi', 'credit_card', 'INV-2024-101', now() - interval '1 day'),
        (customer2_id, 3000.00, 'TRY', 'pending', 'Yıllık paket ödemesi', 'bank_transfer', 'INV-2024-102', now())
    ON CONFLICT DO NOTHING
    RETURNING id INTO payment1_id;
    
    SELECT id INTO payment2_id FROM payments WHERE invoice_number = 'INV-2024-102' LIMIT 1;
    
    -- Örnek ticket'ları al
    SELECT id INTO ticket1_id FROM tickets WHERE customer_id = customer1_id LIMIT 1;
    SELECT id INTO ticket2_id FROM tickets WHERE customer_id = customer2_id LIMIT 1;
    
    -- Eğer ticket yoksa, oluştur
    IF ticket1_id IS NULL THEN
        INSERT INTO tickets (title, description, status, priority, category, customer_id, created_at)
        VALUES ('Teknik Destek', 'Sistem sorunu yaşıyorum', 'open', 'high', 'technical', customer1_id, now())
        RETURNING id INTO ticket1_id;
    END IF;
    
    IF ticket2_id IS NULL THEN
        INSERT INTO tickets (title, description, status, priority, category, customer_id, created_at)
        VALUES ('Fatura Sorgusu', 'Faturamda hata var', 'open', 'medium', 'billing', customer2_id, now())
        RETURNING id INTO ticket2_id;
    END IF;
    
    -- Ödeme planları oluştur
    INSERT INTO payment_plans (customer_id, payment_id, total_amount, remaining_amount, installment_count, current_installment, installment_amount, start_date, next_due_date, status)
    VALUES 
        (customer1_id, payment1_id, 1500.00, 1000.00, 3, 1, 500.00, now() - interval '1 day', now() + interval '2 weeks', 'active'),
        (customer2_id, payment2_id, 3000.00, 3000.00, 6, 0, 500.00, now(), now() + interval '2 weeks', 'active')
    RETURNING id INTO payment_plan1_id;
    
    SELECT id INTO payment_plan2_id FROM payment_plans WHERE customer_id = customer2_id LIMIT 1;
    
    -- Hatırlatma planları oluştur
    INSERT INTO reminder_schedules (customer_id, payment_plan_id, reminder_type, reminder_date, status, message_template)
    VALUES 
        (customer1_id, payment_plan1_id, 'email', now() + interval '1 week', 'pending', 'Sayın müşterimiz, ödemenizin vadesi yaklaşıyor.'),
        (customer1_id, payment_plan1_id, 'sms', now() + interval '3 days', 'pending', 'Ödemenizin vadesi 3 gün sonra doluyor.'),
        (customer2_id, payment_plan2_id, 'email', now() + interval '2 weeks', 'pending', 'Sayın müşterimiz, ödeme planınızın ilk taksiti yaklaşıyor.');
    
    -- Sohbet oturumları oluştur
    INSERT INTO chat_sessions (ticket_id, session_duration, message_count, agent_name, rating, summary)
    VALUES 
        (ticket1_id, 45, 12, 'Ahmet Yılmaz', 5, 'Müşteri teknik destek talebinde bulundu, sorun çözüldü.'),
        (ticket2_id, 30, 8, 'Ayşe Demir', 4, 'Fatura sorgusu yapıldı, bilgilendirme tamamlandı.');
    
    -- Öncelik analizi geçmişi oluştur
    INSERT INTO priority_analysis_history (ticket_id, customer_id, original_priority, suggested_priority, confidence_score, reasoning)
    VALUES 
        (ticket1_id, customer1_id, 'medium', 'high', 85, 'Müşteri geçmişi ve iş etkisi analizi sonucu yüksek öncelik önerildi.'),
        (ticket2_id, customer2_id, 'low', 'medium', 75, 'Fatura sorgusu için orta öncelik uygun görüldü.');
    
    -- Müşteri davranış analizi oluştur
    INSERT INTO customer_behavior_analytics (customer_id, behavior_type, behavior_data, confidence_score)
    VALUES 
        (customer1_id, 'priority_preference', '{"high_priority_ratio": 0.7, "urgent_tickets": 2, "avg_response_time": 2.5}', 85),
        (customer2_id, 'payment_pattern', '{"avg_payment_delay": 3.2, "payment_method_preference": "credit_card", "installment_usage": 0.4}', 78);
    
END $$;

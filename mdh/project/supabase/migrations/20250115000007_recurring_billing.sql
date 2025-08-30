-- Otomatik Fatura Oluşturma (Recurring Billing) Sistemi
-- Migration: 20250115000007_recurring_billing.sql

-- 1. Tekrarlayan Fatura Şablonları Tablosu
CREATE TABLE IF NOT EXISTS recurring_invoice_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'weekly', 'daily')),
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'TRY',
  tax_rate decimal(5,2) DEFAULT 0,
  auto_generate boolean DEFAULT true,
  next_generation_date timestamptz,
  last_generated_at timestamptz,
  template_config jsonb DEFAULT '{}', -- Fatura şablonu ayarları
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Müşteri Abonelikleri Tablosu
CREATE TABLE IF NOT EXISTS customer_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  template_id uuid REFERENCES recurring_invoice_templates(id) ON DELETE SET NULL,
  subscription_name text NOT NULL,
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'weekly', 'daily')),
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'TRY',
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  next_billing_date timestamptz NOT NULL,
  auto_renew boolean DEFAULT true,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  custom_fields jsonb DEFAULT '{}', -- Müşteri özel alanları
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Otomatik Fatura Geçmişi Tablosu
CREATE TABLE IF NOT EXISTS recurring_invoice_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES customer_subscriptions(id) ON DELETE CASCADE,
  template_id uuid REFERENCES recurring_invoice_templates(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  billing_cycle text NOT NULL,
  amount decimal(10,2) NOT NULL,
  generated_at timestamptz DEFAULT now(),
  due_date timestamptz NOT NULL,
  status text DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'paid', 'overdue', 'cancelled')),
  error_message text,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 4. Fatura Şablonları Tablosu
CREATE TABLE IF NOT EXISTS invoice_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  template_type text DEFAULT 'standard' CHECK (template_type IN ('standard', 'detailed', 'simple', 'custom')),
  header_html text,
  body_html text,
  footer_html text,
  css_styles text,
  variables jsonb DEFAULT '[]', -- Şablon değişkenleri
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Fatura Otomasyon Kuralları Tablosu
CREATE TABLE IF NOT EXISTS invoice_automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  rule_type text NOT NULL CHECK (rule_type IN ('schedule', 'condition', 'action')),
  trigger_conditions jsonb NOT NULL, -- Tetikleme koşulları
  actions jsonb NOT NULL, -- Yapılacak aksiyonlar
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_recurring_invoice_templates_active ON recurring_invoice_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_invoice_templates_next_gen ON recurring_invoice_templates(next_generation_date);
CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_customer_id ON customer_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_status ON customer_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_next_billing ON customer_subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_recurring_invoice_history_subscription_id ON recurring_invoice_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoice_history_status ON recurring_invoice_history(status);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_active ON invoice_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_invoice_automation_rules_active ON invoice_automation_rules(is_active);

-- RLS Politikaları (Geliştirme aşamasında devre dışı)
-- ALTER TABLE recurring_invoice_templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE recurring_invoice_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoice_automation_rules ENABLE ROW LEVEL SECURITY;

-- Varsayılan Fatura Şablonları
INSERT INTO invoice_templates (name, description, template_type, header_html, body_html, footer_html, is_default) VALUES
('Standart Fatura', 'Genel kullanım için standart fatura şablonu', 'standard',
'<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="color: #2563eb; margin: 0;">{{company_name}}</h1>
  <p style="color: #6b7280; margin: 5px 0;">{{company_address}}</p>
  <p style="color: #6b7280; margin: 5px 0;">Tel: {{company_phone}} | E-posta: {{company_email}}</p>
</div>',
'<div style="margin: 20px 0;">
  <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
    <div>
      <h3>Fatura Bilgileri</h3>
      <p><strong>Fatura No:</strong> {{invoice_number}}</p>
      <p><strong>Tarih:</strong> {{invoice_date}}</p>
      <p><strong>Vade Tarihi:</strong> {{due_date}}</p>
    </div>
    <div>
      <h3>Müşteri Bilgileri</h3>
      <p><strong>Ad:</strong> {{customer_name}}</p>
      <p><strong>E-posta:</strong> {{customer_email}}</p>
      <p><strong>Adres:</strong> {{customer_address}}</p>
    </div>
  </div>
  
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <thead>
      <tr style="background-color: #f3f4f6;">
        <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Açıklama</th>
        <th style="border: 1px solid #d1d5db; padding: 10px; text-align: right;">Tutar</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border: 1px solid #d1d5db; padding: 10px;">{{service_description}}</td>
        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right;">{{amount}} {{currency}}</td>
      </tr>
    </tbody>
  </table>
  
  <div style="text-align: right; margin-top: 20px;">
    <p><strong>Toplam:</strong> {{total_amount}} {{currency}}</p>
  </div>
</div>',
'<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #d1d5db; text-align: center; color: #6b7280;">
  <p>Bu fatura otomatik olarak oluşturulmuştur.</p>
  <p>Ödeme detayları için lütfen bizimle iletişime geçin.</p>
</div>',
true),

('Detaylı Fatura', 'Detaylı açıklamalar ve çoklu kalemler için', 'detailed',
'<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="color: #2563eb; margin: 0;">{{company_name}}</h1>
  <p style="color: #6b7280; margin: 5px 0;">{{company_address}}</p>
  <p style="color: #6b7280; margin: 5px 0;">Tel: {{company_phone}} | E-posta: {{company_email}}</p>
</div>',
'<div style="margin: 20px 0;">
  <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
    <div>
      <h3>Fatura Bilgileri</h3>
      <p><strong>Fatura No:</strong> {{invoice_number}}</p>
      <p><strong>Tarih:</strong> {{invoice_date}}</p>
      <p><strong>Vade Tarihi:</strong> {{due_date}}</p>
      <p><strong>Dönem:</strong> {{billing_period}}</p>
    </div>
    <div>
      <h3>Müşteri Bilgileri</h3>
      <p><strong>Ad:</strong> {{customer_name}}</p>
      <p><strong>E-posta:</strong> {{customer_email}}</p>
      <p><strong>Adres:</strong> {{customer_address}}</p>
      <p><strong>Müşteri No:</strong> {{customer_id}}</p>
    </div>
  </div>
  
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <thead>
      <tr style="background-color: #f3f4f6;">
        <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Açıklama</th>
        <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Miktar</th>
        <th style="border: 1px solid #d1d5db; padding: 10px; text-align: right;">Birim Fiyat</th>
        <th style="border: 1px solid #d1d5db; padding: 10px; text-align: right;">Toplam</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td style="border: 1px solid #d1d5db; padding: 10px;">{{description}}</td>
        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">{{quantity}}</td>
        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right;">{{unit_price}} {{currency}}</td>
        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: right;">{{total}} {{currency}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  
  <div style="text-align: right; margin-top: 20px;">
    <p><strong>Ara Toplam:</strong> {{subtotal}} {{currency}}</p>
    <p><strong>KDV ({{tax_rate}}%):</strong> {{tax_amount}} {{currency}}</p>
    <p><strong>Toplam:</strong> {{total_amount}} {{currency}}</p>
  </div>
</div>',
'<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #d1d5db; text-align: center; color: #6b7280;">
  <p>Bu fatura otomatik olarak oluşturulmuştur.</p>
  <p>Ödeme detayları için lütfen bizimle iletişime geçin.</p>
  <p>Teşekkürler!</p>
</div>',
false);

-- Varsayılan Tekrarlayan Fatura Şablonları
INSERT INTO recurring_invoice_templates (name, description, billing_cycle, amount, auto_generate) VALUES
('Aylık Hosting Hizmeti', 'Aylık web hosting hizmeti faturası', 'monthly', 99.99, true),
('3 Aylık Bakım Hizmeti', '3 aylık sistem bakım ve destek hizmeti', 'quarterly', 299.99, true),
('Yıllık Lisans', 'Yıllık yazılım lisans ücreti', 'yearly', 999.99, true),
('Haftalık Danışmanlık', 'Haftalık IT danışmanlık hizmeti', 'weekly', 250.00, true);

-- PostgreSQL Fonksiyonları

-- 1. Sonraki Fatura Tarihini Hesaplama Fonksiyonu
CREATE OR REPLACE FUNCTION calculate_next_billing_date(
  current_date timestamptz,
  billing_cycle text
)
RETURNS timestamptz AS $$
BEGIN
  RETURN CASE billing_cycle
    WHEN 'daily' THEN current_date + INTERVAL '1 day'
    WHEN 'weekly' THEN current_date + INTERVAL '1 week'
    WHEN 'monthly' THEN current_date + INTERVAL '1 month'
    WHEN 'quarterly' THEN current_date + INTERVAL '3 months'
    WHEN 'yearly' THEN current_date + INTERVAL '1 year'
    ELSE current_date + INTERVAL '1 month'
  END;
END;
$$ LANGUAGE plpgsql;

-- 2. Otomatik Fatura Oluşturma Fonksiyonu
CREATE OR REPLACE FUNCTION generate_recurring_invoices()
RETURNS jsonb AS $$
DECLARE
  subscription_record RECORD;
  new_invoice_id uuid;
  new_history_id uuid;
  generated_count integer := 0;
  error_count integer := 0;
  result jsonb;
BEGIN
  -- Vadesi gelen abonelikleri bul
  FOR subscription_record IN 
    SELECT cs.*, rt.name as template_name, rt.amount as template_amount
    FROM customer_subscriptions cs
    LEFT JOIN recurring_invoice_templates rt ON cs.template_id = rt.id
    WHERE cs.status = 'active' 
      AND cs.next_billing_date <= NOW()
      AND (cs.end_date IS NULL OR cs.end_date > NOW())
  LOOP
    BEGIN
      -- Yeni fatura oluştur
      INSERT INTO payments (
        customer_id,
        amount,
        currency,
        status,
        payment_date,
        due_date,
        description,
        invoice_number
      ) VALUES (
        subscription_record.customer_id,
        subscription_record.amount,
        subscription_record.currency,
        'pending',
        NOW(),
        subscription_record.next_billing_date + INTERVAL '30 days',
        subscription_record.subscription_name || ' - ' || subscription_record.template_name,
        'INV-' || EXTRACT(YEAR FROM NOW()) || '-' || 
        LPAD(EXTRACT(MONTH FROM NOW())::text, 2, '0') || '-' || 
        LPAD(EXTRACT(DAY FROM NOW())::text, 2, '0') || '-' || 
        SUBSTRING(gen_random_uuid()::text, 1, 8)
      ) RETURNING id INTO new_invoice_id;

      -- Fatura geçmişine kaydet
      INSERT INTO recurring_invoice_history (
        subscription_id,
        template_id,
        invoice_id,
        billing_cycle,
        amount,
        due_date,
        status
      ) VALUES (
        subscription_record.id,
        subscription_record.template_id,
        new_invoice_id,
        subscription_record.billing_cycle,
        subscription_record.amount,
        subscription_record.next_billing_date + INTERVAL '30 days',
        'generated'
      ) RETURNING id INTO new_history_id;

      -- Sonraki fatura tarihini güncelle
      UPDATE customer_subscriptions 
      SET next_billing_date = calculate_next_billing_date(
        subscription_record.next_billing_date, 
        subscription_record.billing_cycle
      ),
      updated_at = NOW()
      WHERE id = subscription_record.id;

      generated_count := generated_count + 1;

    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      -- Hata logunu kaydet
      INSERT INTO recurring_invoice_history (
        subscription_id,
        template_id,
        billing_cycle,
        amount,
        due_date,
        status,
        error_message
      ) VALUES (
        subscription_record.id,
        subscription_record.template_id,
        subscription_record.billing_cycle,
        subscription_record.amount,
        subscription_record.next_billing_date + INTERVAL '30 days',
        'error',
        SQLERRM
      );
    END;
  END LOOP;

  result := jsonb_build_object(
    'success', true,
    'generated_count', generated_count,
    'error_count', error_count,
    'generated_at', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. Abonelik Durumu Kontrol Fonksiyonu
CREATE OR REPLACE FUNCTION check_subscription_status()
RETURNS void AS $$
BEGIN
  -- Süresi dolan abonelikleri pasif yap
  UPDATE customer_subscriptions 
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'active' 
    AND end_date IS NOT NULL 
    AND end_date <= NOW();

  -- Vadesi geçen faturaları güncelle
  UPDATE recurring_invoice_history 
  SET status = 'overdue'
  WHERE status = 'generated' 
    AND due_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger'lar

-- 1. Updated at trigger'ları
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recurring_invoice_templates_updated_at
    BEFORE UPDATE ON recurring_invoice_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_customer_subscriptions_updated_at
    BEFORE UPDATE ON customer_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_invoice_templates_updated_at
    BEFORE UPDATE ON invoice_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Abonelik oluşturulduğunda otomatik ilk fatura tarihi
CREATE OR REPLACE FUNCTION set_initial_billing_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.next_billing_date IS NULL THEN
    NEW.next_billing_date = calculate_next_billing_date(NEW.start_date, NEW.billing_cycle);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_initial_billing_date
    BEFORE INSERT ON customer_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION set_initial_billing_date();

-- Başarı mesajı
SELECT 'Recurring Billing sistemi başarıyla kuruldu!' as message;

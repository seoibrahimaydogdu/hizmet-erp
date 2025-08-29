-- Ödeme Takibi ve Hatırlatma Sistemi Tabloları

-- Faturalar tablosu
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  amount decimal(10,2) NOT NULL,
  due_date date NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  paid_at timestamptz,
  notes text
);

-- Hatırlatma geçmişi tablosu
CREATE TABLE IF NOT EXISTS reminder_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  template_id text NOT NULL,
  message text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  sent_by uuid,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  sent_to text,
  subject text,
  created_at timestamptz DEFAULT now()
);

-- Template'ler tablosu (kullanıcı özel template'leri için)
CREATE TABLE IF NOT EXISTS payment_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  template text NOT NULL,
  variables jsonb DEFAULT '[]',
  category text DEFAULT 'reminder' CHECK (category IN ('reminder', 'warning', 'urgent', 'final')),
  days_after_due integer DEFAULT 0,
  is_default boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- İndeksler
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_customer_email ON invoices(customer_email);
CREATE INDEX idx_reminder_history_invoice_id ON reminder_history(invoice_id);
CREATE INDEX idx_reminder_history_sent_at ON reminder_history(sent_at);
CREATE INDEX idx_payment_templates_category ON payment_templates(category);

-- RLS (Row Level Security) politikaları
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_templates ENABLE ROW LEVEL SECURITY;

-- Invoices politikaları
CREATE POLICY "Users can view invoices" ON invoices
    FOR SELECT USING (true);

CREATE POLICY "Users can create invoices" ON invoices
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update invoices" ON invoices
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete invoices" ON invoices
    FOR DELETE USING (true);

-- Reminder history politikaları
CREATE POLICY "Users can view reminder history" ON reminder_history
    FOR SELECT USING (true);

CREATE POLICY "Users can create reminder history" ON reminder_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update reminder history" ON reminder_history
    FOR UPDATE USING (true);

-- Payment templates politikaları
CREATE POLICY "Users can view payment templates" ON payment_templates
    FOR SELECT USING (true);

CREATE POLICY "Users can create payment templates" ON payment_templates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update payment templates" ON payment_templates
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete payment templates" ON payment_templates
    FOR DELETE USING (true);

-- Otomatik updated_at güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger'lar
CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_templates_updated_at 
    BEFORE UPDATE ON payment_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Örnek veriler (test için)
INSERT INTO invoices (invoice_number, customer_name, customer_email, amount, due_date, status) VALUES
('INV-2024-001', 'Ahmet Yılmaz', 'ahmet@example.com', 1500.00, '2024-08-15', 'overdue'),
('INV-2024-002', 'Fatma Demir', 'fatma@example.com', 2500.00, '2024-08-20', 'overdue'),
('INV-2024-003', 'Mehmet Kaya', 'mehmet@example.com', 800.00, '2024-08-25', 'pending'),
('INV-2024-004', 'Ayşe Özkan', 'ayse@example.com', 1200.00, '2024-08-30', 'pending'),
('INV-2024-005', 'Ali Çelik', 'ali@example.com', 3000.00, '2024-07-30', 'overdue')
ON CONFLICT (invoice_number) DO NOTHING;

-- Varsayılan template'ler
INSERT INTO payment_templates (title, template, variables, category, days_after_due, is_default) VALUES
('İlk Hatırlatma - Nazik Uyarı', 
'Sayın {müşteri_adı},

{ödeme_tutari} TL tutarındaki {fatura_no} numaralı faturanızın vade tarihi {vade_tarihi} olup, ödemeniz henüz alınamamıştır.

Ödemenizi en kısa sürede yapmanızı rica ederiz. Herhangi bir sorunuz varsa bizimle iletişime geçebilirsiniz.

Teşekkürler,
{şirket_adı}',
'["müşteri_adı", "ödeme_tutari", "fatura_no", "vade_tarihi", "şirket_adı"]',
'reminder', 3, true),

('İkinci Hatırlatma - Önemli Uyarı',
'Sayın {müşteri_adı},

{ödeme_tutari} TL tutarındaki {fatura_no} numaralı faturanızın vade tarihi {vade_tarihi} olup, ödemeniz henüz alınamamıştır.

Bu durumun devam etmesi durumunda gecikme faizi uygulanabilir. Lütfen ödemenizi acilen yapınız.

Ödeme seçenekleri:
- Banka havalesi: {banka_hesap_bilgileri}
- Online ödeme: {ödeme_linki}

Sorularınız için: {iletişim_bilgileri}

Saygılarımızla,
{şirket_adı}',
'["müşteri_adı", "ödeme_tutari", "fatura_no", "vade_tarihi", "banka_hesap_bilgileri", "ödeme_linki", "iletişim_bilgileri", "şirket_adı"]',
'warning', 7, true)
ON CONFLICT DO NOTHING;

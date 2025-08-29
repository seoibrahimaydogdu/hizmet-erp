-- Özellik önerisi kategorisi ekleme ve ticket_type güncelleme
-- Bu migration özellik önerilerini ayrı bir tip olarak işaretler

-- Ticket type'a 'feature_request' ekle
ALTER TABLE tickets 
DROP CONSTRAINT IF EXISTS tickets_ticket_type_check;

ALTER TABLE tickets 
ADD CONSTRAINT tickets_ticket_type_check 
CHECK (ticket_type IN ('regular', 'reminder', 'notification', 'feature_request'));

-- Mevcut feature kategorisindeki talepleri feature_request olarak işaretle
UPDATE tickets 
SET ticket_type = 'feature_request' 
WHERE category = 'feature' AND ticket_type = 'regular';

-- Yeni kategori seçenekleri için enum tablosu oluştur (opsiyonel)
CREATE TABLE IF NOT EXISTS ticket_categories (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Varsayılan kategorileri ekle
INSERT INTO ticket_categories (code, name, description, icon, color) VALUES
('general', 'Genel', 'Genel sorular ve talepler', 'help-circle', '#6b7280'),
('technical', 'Teknik Destek', 'Teknik sorunlar ve destek talepleri', 'settings', '#3b82f6'),
('billing', 'Faturalama', 'Fatura ve ödeme sorunları', 'credit-card', '#10b981'),
('feature', 'Özellik İsteği', 'Yeni özellik önerileri ve geliştirme talepleri', 'lightbulb', '#f59e0b'),
('bug', 'Hata Bildirimi', 'Sistem hataları ve bug raporları', 'bug', '#ef4444'),
('account', 'Hesap Yönetimi', 'Hesap ayarları ve yönetimi', 'user', '#8b5cf6'),
('payment', 'Ödeme Sorunları', 'Ödeme işlemleri ve sorunları', 'dollar-sign', '#06b6d4'),
('project', 'Proje Soruları', 'Proje ile ilgili sorular ve talepler', 'folder', '#84cc16'),
('feature_request', 'Özellik Önerisi', 'Müşteri özellik önerileri ve geliştirme talepleri', 'star', '#ec4899')
ON CONFLICT (code) DO NOTHING;

-- İndeks ekle
CREATE INDEX IF NOT EXISTS idx_ticket_categories_code ON ticket_categories(code);
CREATE INDEX IF NOT EXISTS idx_ticket_categories_active ON ticket_categories(is_active);

-- Payments tablosuna eksik sütunları ekleme

-- Description sütunu ekle
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS description text;

-- Invoice number sütunu ekle
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS invoice_number text;

-- Mevcut kayıtlara varsayılan değerler ata
UPDATE payments 
SET description = COALESCE(description, 'Ödeme açıklaması')
WHERE description IS NULL;

UPDATE payments 
SET invoice_number = COALESCE(invoice_number, 'INV-' || EXTRACT(YEAR FROM created_at) || '-' || LPAD(EXTRACT(MONTH FROM created_at)::text, 2, '0') || '-' || LPAD(EXTRACT(DAY FROM created_at)::text, 2, '0') || '-' || SUBSTRING(id::text, 1, 8))
WHERE invoice_number IS NULL;

-- Sütunları NOT NULL yap (opsiyonel)
-- ALTER TABLE payments ALTER COLUMN description SET NOT NULL;
-- ALTER TABLE payments ALTER COLUMN invoice_number SET NOT NULL;

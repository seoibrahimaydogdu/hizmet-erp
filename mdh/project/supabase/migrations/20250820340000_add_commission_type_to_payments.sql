-- Payments tablosuna commission_type sütunu ekleme
-- Bu sütun komisyon hesaplama türünü belirtir: 'included' veya 'added'

-- commission_type sütununu ekle
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS commission_type text DEFAULT 'included' CHECK (commission_type IN ('included', 'added'));

-- Mevcut kayıtlar için varsayılan değer ata
UPDATE payments 
SET commission_type = 'included' 
WHERE commission_type IS NULL;

-- Sütunu NOT NULL yap
ALTER TABLE payments 
ALTER COLUMN commission_type SET NOT NULL;

-- Açıklama ekle
COMMENT ON COLUMN payments.commission_type IS 'Komisyon hesaplama türü: included (içinden al) veya added (üstüne ekle)';

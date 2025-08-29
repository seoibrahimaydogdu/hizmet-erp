-- Kopya Faturaları Temizleme Migration'ı
-- Bu migration, aynı invoice_number'a sahip kopya faturaları temizler

-- 1. Önce kopya faturaları tespit et ve listele
-- Aynı invoice_number'a sahip faturaları bul, en eski olanı tut, diğerlerini sil
WITH duplicate_invoices AS (
  SELECT 
    invoice_number,
    COUNT(*) as duplicate_count,
    MIN(created_at) as oldest_created_atHata Detayları (Sadece Geliştirme)
Mesaj: Users is not defined
Hata ID: error_1755534270207_ln3ubhp69
Stack:
ReferenceError: Users is not defined
    at PaymentManagement (http://localhost:5173/src/components/financial/PaymentManagement.tsx?t=1755533185255:275:38)
    at renderWithHooks (http://localhost:5173/node_modules/.vite/deps/chunk-WRD5HZVH.js?v=7830809c:11548:26)
    at mountIndeterminateComponent (http://localhost:5173/node_modules/.vite/deps/chunk-WRD5HZVH.js?v=7830809c:14926:21)
    at beginWork (http://localhost:5173/node_modules/.vite/deps/chunk-WRD5HZVH.js?v=7830809c:15914:22)
    at beginWork$1 (http://localhost:5173/node_modules/.vite/deps/chunk-WRD5HZVH.js?v=7830809c:19753:22)
    at performUnitOfWork (http://localhost:5173/node_modules/.vite/deps/chunk-WRD5HZVH.js?v=7830809c:19198:20)
    at workLoopSync (http://localhost:5173/node_modules/.vite/deps/chunk-WRD5HZVH.js?v=7830809c:19137:13)
    at renderRootSync (http://localhost:5173/node_modules/.vite/deps/chunk-WRD5HZVH.js?v=7830809c:19116:15)
    at recoverFromConcurrentError (http://localhost:5173/node_modules/.vite/deps/chunk-WRD5HZVH.js?v=7830809c:18736:28)
    at performSyncWorkOnRoot (http://localhost:5173/node_modules/.vite/deps/chunk-WRD5HZVH.js?v=7830809c:18879:28)
  FROM payments 
  WHERE invoice_number IS NOT NULL 
    AND invoice_number != ''
  GROUP BY invoice_number 
  HAVING COUNT(*) > 1
),
invoices_to_delete AS (
  SELECT p.id
  FROM payments p
  INNER JOIN duplicate_invoices di ON p.invoice_number = di.invoice_number
  WHERE p.created_at > di.oldest_created_at
)
DELETE FROM payments 
WHERE id IN (SELECT id FROM invoices_to_delete);

-- 2. Invoice number için UNIQUE constraint ekle (eğer yoksa)
-- Bu, gelecekte kopya faturaların oluşmasını engelleyecek
DO $$ 
BEGIN
  -- Önce mevcut constraint'leri kontrol et
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payments_invoice_number_unique' 
    AND table_name = 'payments'
  ) THEN
    -- UNIQUE constraint ekle
    ALTER TABLE payments ADD CONSTRAINT payments_invoice_number_unique UNIQUE (invoice_number);
  END IF;
END $$;

-- 3. Invoice number'ları NULL olan kayıtlar için otomatik değer ata
UPDATE payments 
SET invoice_number = 'INV-' || EXTRACT(YEAR FROM created_at) || '-' || 
                    LPAD(EXTRACT(MONTH FROM created_at)::text, 2, '0') || '-' || 
                    LPAD(EXTRACT(DAY FROM created_at)::text, 2, '0') || '-' || 
                    SUBSTRING(id::text, 1, 8)
WHERE invoice_number IS NULL OR invoice_number = '';

-- 4. Invoice number'ları boş string olan kayıtlar için de otomatik değer ata
UPDATE payments 
SET invoice_number = 'INV-' || EXTRACT(YEAR FROM created_at) || '-' || 
                    LPAD(EXTRACT(MONTH FROM created_at)::text, 2, '0') || '-' || 
                    LPAD(EXTRACT(DAY FROM created_at)::text, 2, '0') || '-' || 
                    SUBSTRING(id::text, 1, 8)
WHERE invoice_number = '';

-- 5. Temizlik sonrası istatistikler
-- Kopya faturaların temizlendiğini doğrula
SELECT 
  'Temizlik Sonrası Durum' as durum,
  COUNT(*) as toplam_fatura,
  COUNT(DISTINCT invoice_number) as benzersiz_fatura_kodu,
  COUNT(*) - COUNT(DISTINCT invoice_number) as kalan_kopya_sayisi
FROM payments 
WHERE invoice_number IS NOT NULL AND invoice_number != '';

-- 6. Invoice number'ları için index oluştur (performans için)
CREATE INDEX IF NOT EXISTS idx_payments_invoice_number ON payments(invoice_number);

-- 7. Invoice number'ları için trigger oluştur (otomatik değer atama için)
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Eğer invoice_number boşsa veya NULL ise, otomatik değer ata
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || 
                         EXTRACT(YEAR FROM NEW.created_at) || '-' || 
                         LPAD(EXTRACT(MONTH FROM NEW.created_at)::text, 2, '0') || '-' || 
                         LPAD(EXTRACT(DAY FROM NEW.created_at)::text, 2, '0') || '-' || 
                         SUBSTRING(NEW.id::text, 1, 8);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı oluştur (eğer yoksa)
DROP TRIGGER IF EXISTS trigger_generate_invoice_number ON payments;
CREATE TRIGGER trigger_generate_invoice_number
  BEFORE INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();

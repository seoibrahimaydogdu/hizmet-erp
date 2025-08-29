/*
  # Para Birimi Sistemi Güncellemesi

  1. Customers tablosuna currency alanı eklendi
  2. Varsayılan para birimi TRY (Türk Lirası) olarak ayarlandı
  3. Mevcut politikalar korundu
*/

-- Customers tablosuna currency alanı ekle (eğer yoksa)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'currency'
    ) THEN
        ALTER TABLE customers ADD COLUMN currency text DEFAULT 'TRY';
    END IF;
END $$;

-- Mevcut customers kayıtlarını TRY para birimi ile güncelle
UPDATE customers SET currency = 'TRY' WHERE currency IS NULL;

-- Currency alanını NOT NULL yap
ALTER TABLE customers ALTER COLUMN currency SET NOT NULL;

-- Currency için check constraint ekle
ALTER TABLE customers ADD CONSTRAINT customers_currency_check 
CHECK (currency IN ('TRY', 'USD', 'EUR'));

-- Mevcut politikaları kontrol et ve gerekirse yeniden oluştur
DO $$
BEGIN
    -- Read policy kontrolü
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' 
        AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON customers
        FOR SELECT TO public USING (true);
    END IF;

    -- Insert policy kontrolü
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' 
        AND policyname = 'Enable insert for all users'
    ) THEN
        CREATE POLICY "Enable insert for all users" ON customers
        FOR INSERT TO public WITH CHECK (true);
    END IF;

    -- Update policy kontrolü
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' 
        AND policyname = 'Enable update for all users'
    ) THEN
        CREATE POLICY "Enable update for all users" ON customers
        FOR UPDATE TO public USING (true);
    END IF;
END $$;

-- RLS'yi etkinleştir (eğer etkin değilse)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Para birimi seçenekleri için enum tipi oluştur (opsiyonel)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_type') THEN
        CREATE TYPE currency_type AS ENUM ('TRY', 'USD', 'EUR');
    END IF;
END $$;

-- Currency alanını enum tipine çevir (opsiyonel - daha sonra yapılabilir)
-- ALTER TABLE customers ALTER COLUMN currency TYPE currency_type USING currency::currency_type;

-- Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_customers_currency ON customers(currency);

-- Fonksiyon oluştur (para birimi formatlama için)
CREATE OR REPLACE FUNCTION format_currency(amount numeric, currency_code text)
RETURNS text AS $$
BEGIN
    CASE currency_code
        WHEN 'TRY' THEN
            RETURN '₺' || to_char(amount, 'FM999,999,999,990.00');
        WHEN 'USD' THEN
            RETURN '$' || to_char(amount, 'FM999,999,999,990.00');
        WHEN 'EUR' THEN
            RETURN '€' || to_char(amount, 'FM999,999,999,990.00');
        ELSE
            RETURN to_char(amount, 'FM999,999,999,990.00');
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger fonksiyonu (currency değişikliklerini loglamak için)
CREATE OR REPLACE FUNCTION log_currency_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.currency IS DISTINCT FROM NEW.currency THEN
        INSERT INTO system_logs (action, table_name, record_id, old_values, new_values, created_at)
        VALUES (
            'UPDATE',
            'customers',
            NEW.id,
            jsonb_build_object('currency', OLD.currency),
            jsonb_build_object('currency', NEW.currency),
            now()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur (eğer system_logs tablosu varsa)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_logs') THEN
        DROP TRIGGER IF EXISTS customers_currency_change_trigger ON customers;
        CREATE TRIGGER customers_currency_change_trigger
        AFTER UPDATE ON customers
        FOR EACH ROW
        EXECUTE FUNCTION log_currency_changes();
    END IF;
END $$;

-- Örnek veri ekle (test için)
INSERT INTO customers (name, email, phone, company, plan, currency, created_at, updated_at)
VALUES 
    ('Test Müşteri TRY', 'test-try@example.com', '+90 555 123 4567', 'Test Şirketi TRY', 'basic', 'TRY', now(), now()),
    ('Test Müşteri USD', 'test-usd@example.com', '+1 555 123 4567', 'Test Company USD', 'premium', 'USD', now(), now()),
    ('Test Müşteri EUR', 'test-eur@example.com', '+49 555 123 4567', 'Test Firma EUR', 'enterprise', 'EUR', now(), now())
ON CONFLICT (email) DO NOTHING;

-- Migration tamamlandı mesajı
DO $$
BEGIN
    RAISE NOTICE 'Para birimi sistemi başarıyla güncellendi. Customers tablosuna currency alanı eklendi.';
END $$;

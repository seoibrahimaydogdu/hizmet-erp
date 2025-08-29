-- Payments tablosu foreign key constraint düzeltmesi
-- subscription_id için ON DELETE SET NULL yapılıyor

-- Önce mevcut foreign key constraint'i kaldır
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_subscription_id_fkey;

-- Yeni foreign key constraint ekle
ALTER TABLE payments 
ADD CONSTRAINT payments_subscription_id_fkey 
FOREIGN KEY (subscription_id) 
REFERENCES subscriptions(id) 
ON DELETE SET NULL;

-- Payment method ve status için check constraint'ler ekle
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE payments 
ADD CONSTRAINT payments_payment_method_check 
CHECK (payment_method IN ('credit_card', 'Credit Card', 'bank_transfer', 'cash', 'check'));

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments 
ADD CONSTRAINT payments_status_check 
CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'overdue'));

-- Amount için pozitif değer kontrolü
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_amount_positive;
ALTER TABLE payments 
ADD CONSTRAINT payments_amount_positive 
CHECK (amount > 0);

-- Currency için geçerli değer kontrolü
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_currency_check;
ALTER TABLE payments 
ADD CONSTRAINT payments_currency_check 
CHECK (currency IN ('TRY', 'USD', 'EUR'));

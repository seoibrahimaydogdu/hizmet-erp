/*
  # Gelir ve Gider Yönetimi Tabloları

  1. Yeni Tablolar
    - `subscription_plans` - Abonelik paketleri
    - `subscriptions` - Müşteri abonelikleri
    - `payments` - Ödeme kayıtları
    - `expenses` - Gider kayıtları
    - `expense_categories` - Gider kategorileri
    - `promotions` - Promosyon ve indirimler
    - `budgets` - Bütçe yönetimi
    - `financial_reports` - Finansal raporlar

  2. İlişkiler
    - subscriptions -> customers (customer_id)
    - subscriptions -> subscription_plans (plan_id)
    - payments -> subscriptions (subscription_id)
    - payments -> customers (customer_id)
    - expenses -> expense_categories (category_id)
    - budgets -> expense_categories (category_id)

  3. Güvenlik
    - Tüm tablolar için RLS etkin
    - Public erişim politikaları
*/

-- Abonelik paketleri tablosu
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  billing_cycle text DEFAULT 'monthly', -- monthly, yearly, quarterly
  features jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Abonelikler tablosu
DROP TABLE IF EXISTS subscriptions CASCADE;
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE SET NULL,
  plan_name text,
  status text DEFAULT 'active', -- active, cancelled, suspended, expired
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  next_billing_date timestamptz,
  auto_renew boolean DEFAULT true,
  discount_percentage decimal(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ödemeler tablosu
DROP TABLE IF EXISTS payments CASCADE;
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'TRY',
  payment_method text DEFAULT 'credit_card', -- credit_card, bank_transfer, cash, check
  status text DEFAULT 'pending', -- pending, completed, failed, refunded, overdue
  transaction_id text,
  payment_date timestamptz,
  due_date timestamptz,
  invoice_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Gider kategorileri tablosu
CREATE TABLE IF NOT EXISTS expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Giderler tablosu
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES expense_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'TRY',
  expense_date timestamptz NOT NULL,
  vendor text,
  invoice_number text,
  receipt_url text,
  is_recurring boolean DEFAULT false,
  recurring_interval text, -- monthly, yearly, quarterly
  next_due_date timestamptz,
  status text DEFAULT 'pending', -- pending, approved, paid
  approved_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Promosyonlar tablosu
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  discount_type text DEFAULT 'percentage', -- percentage, fixed_amount
  discount_value decimal(10,2) NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  usage_limit integer,
  used_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Promosyon kullanım kayıtları tablosu
DROP TABLE IF EXISTS promotion_usage CASCADE;
CREATE TABLE promotion_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid REFERENCES promotions(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  discount_amount decimal(10,2) NOT NULL,
  original_amount decimal(10,2) NOT NULL,
  final_amount decimal(10,2) NOT NULL,
  usage_context text, -- 'subscription', 'payment', 'manual'
  usage_reason text, -- Kullanım nedeni/açıklaması
  used_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Bütçeler tablosu
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES expense_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount decimal(10,2) NOT NULL,
  period text DEFAULT 'monthly', -- monthly, yearly, quarterly
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Finansal raporlar tablosu
CREATE TABLE IF NOT EXISTS financial_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL, -- monthly, quarterly, yearly
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  total_revenue decimal(15,2) DEFAULT 0,
  total_expenses decimal(15,2) DEFAULT 0,
  net_profit decimal(15,2) DEFAULT 0,
  mrr decimal(15,2) DEFAULT 0, -- Monthly Recurring Revenue
  churn_rate decimal(5,2) DEFAULT 0,
  report_data jsonb DEFAULT '{}',
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- RLS Politikaları
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;

-- Subscription Plans politikaları
DROP POLICY IF EXISTS "Enable read access for all users" ON subscription_plans;
DROP POLICY IF EXISTS "Enable insert for all users" ON subscription_plans;
DROP POLICY IF EXISTS "Enable update for all users" ON subscription_plans;
CREATE POLICY "Enable read access for all users" ON subscription_plans FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON subscription_plans FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON subscription_plans FOR UPDATE TO public USING (true);

-- Subscriptions politikaları
DROP POLICY IF EXISTS "Enable read access for all users" ON subscriptions;
DROP POLICY IF EXISTS "Enable insert for all users" ON subscriptions;
DROP POLICY IF EXISTS "Enable update for all users" ON subscriptions;
CREATE POLICY "Enable read access for all users" ON subscriptions FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON subscriptions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON subscriptions FOR UPDATE TO public USING (true);

-- Payments politikaları
DROP POLICY IF EXISTS "Enable read access for all users" ON payments;
DROP POLICY IF EXISTS "Enable insert for all users" ON payments;
DROP POLICY IF EXISTS "Enable update for all users" ON payments;
CREATE POLICY "Enable read access for all users" ON payments FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON payments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON payments FOR UPDATE TO public USING (true);

-- Expense Categories politikaları
DROP POLICY IF EXISTS "Enable read access for all users" ON expense_categories;
DROP POLICY IF EXISTS "Enable insert for all users" ON expense_categories;
DROP POLICY IF EXISTS "Enable update for all users" ON expense_categories;
CREATE POLICY "Enable read access for all users" ON expense_categories FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON expense_categories FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON expense_categories FOR UPDATE TO public USING (true);

-- Expenses politikaları
DROP POLICY IF EXISTS "Enable read access for all users" ON expenses;
DROP POLICY IF EXISTS "Enable insert for all users" ON expenses;
DROP POLICY IF EXISTS "Enable update for all users" ON expenses;
CREATE POLICY "Enable read access for all users" ON expenses FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON expenses FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON expenses FOR UPDATE TO public USING (true);

-- Promotions politikaları
DROP POLICY IF EXISTS "Enable read access for all users" ON promotions;
DROP POLICY IF EXISTS "Enable insert for all users" ON promotions;
DROP POLICY IF EXISTS "Enable update for all users" ON promotions;
CREATE POLICY "Enable read access for all users" ON promotions FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON promotions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON promotions FOR UPDATE TO public USING (true);

-- Promotion Usage politikaları
DROP POLICY IF EXISTS "Enable read access for all users" ON promotion_usage;
DROP POLICY IF EXISTS "Enable insert for all users" ON promotion_usage;
DROP POLICY IF EXISTS "Enable update for all users" ON promotion_usage;
CREATE POLICY "Enable read access for all users" ON promotion_usage FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON promotion_usage FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON promotion_usage FOR UPDATE TO public USING (true);

-- Budgets politikaları
DROP POLICY IF EXISTS "Enable read access for all users" ON budgets;
DROP POLICY IF EXISTS "Enable insert for all users" ON budgets;
DROP POLICY IF EXISTS "Enable update for all users" ON budgets;
CREATE POLICY "Enable read access for all users" ON budgets FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON budgets FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON budgets FOR UPDATE TO public USING (true);

-- Financial Reports politikaları
DROP POLICY IF EXISTS "Enable read access for all users" ON financial_reports;
DROP POLICY IF EXISTS "Enable insert for all users" ON financial_reports;
DROP POLICY IF EXISTS "Enable update for all users" ON financial_reports;
CREATE POLICY "Enable read access for all users" ON financial_reports FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON financial_reports FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON financial_reports FOR UPDATE TO public USING (true);

-- Örnek veriler
INSERT INTO subscription_plans (name, description, price, billing_cycle, features) VALUES
('Basic', 'Temel özellikler', 99.00, 'monthly', '["Destek", "Temel raporlar", "Email desteği"]'),
('Professional', 'Profesyonel özellikler', 199.00, 'monthly', '["Öncelikli destek", "Gelişmiş raporlar", "Telefon desteği", "API erişimi"]'),
('Enterprise', 'Kurumsal çözümler', 499.00, 'monthly', '["7/24 destek", "Özel entegrasyonlar", "Dedicated manager", "SLA garantisi"]'),
('Basic Yıllık', 'Temel özellikler (yıllık)', 990.00, 'yearly', '["Destek", "Temel raporlar", "Email desteği", "%17 indirim"]'),
('Professional Yıllık', 'Profesyonel özellikler (yıllık)', 1990.00, 'yearly', '["Öncelikli destek", "Gelişmiş raporlar", "Telefon desteği", "API erişimi", "%17 indirim"]')
ON CONFLICT DO NOTHING;

INSERT INTO expense_categories (name, description, color) VALUES
('Pazarlama', 'Pazarlama ve reklam giderleri', '#EF4444'),
('Sunucu', 'Sunucu ve hosting giderleri', '#3B82F6'),
('Personel', 'Maaş ve personel giderleri', '#10B981'),
('Ofis', 'Ofis kirası ve giderleri', '#F59E0B'),
('Lisanslar', 'Yazılım lisansları', '#8B5CF6'),
('Eğitim', 'Eğitim ve gelişim giderleri', '#06B6D4'),
('Seyahat', 'Seyahat ve konaklama', '#84CC16'),
('Diğer', 'Diğer giderler', '#6B7280')
ON CONFLICT DO NOTHING;

-- Müşterilere abonelik atama
DO $$
DECLARE
    customer1_id uuid;
    customer2_id uuid;
    customer3_id uuid;
    plan1_id uuid;
    plan2_id uuid;
    plan3_id uuid;
BEGIN
    SELECT id INTO customer1_id FROM customers WHERE email = 'ahmet@example.com';
    SELECT id INTO customer2_id FROM customers WHERE email = 'ayse@example.com';
    SELECT id INTO customer3_id FROM customers WHERE email = 'mehmet@example.com';
    
    SELECT id INTO plan1_id FROM subscription_plans WHERE name = 'Professional';
    SELECT id INTO plan2_id FROM subscription_plans WHERE name = 'Basic';
    SELECT id INTO plan3_id FROM subscription_plans WHERE name = 'Enterprise';
    
    -- Eğer müşteriler ve planlar bulunduysa abonelik oluştur
    IF customer1_id IS NOT NULL AND plan1_id IS NOT NULL THEN
        INSERT INTO subscriptions (customer_id, plan_id, plan_name, status, start_date, end_date, next_billing_date) VALUES
        (customer1_id, plan1_id, 'Professional', 'active', now() - interval '3 months', now() + interval '9 months', now() + interval '1 month');
    END IF;
    
    IF customer2_id IS NOT NULL AND plan2_id IS NOT NULL THEN
        INSERT INTO subscriptions (customer_id, plan_id, plan_name, status, start_date, end_date, next_billing_date) VALUES
        (customer2_id, plan2_id, 'Basic', 'active', now() - interval '1 month', now() + interval '11 months', now() + interval '1 month');
    END IF;
    
    IF customer3_id IS NOT NULL AND plan3_id IS NOT NULL THEN
        INSERT INTO subscriptions (customer_id, plan_id, plan_name, status, start_date, end_date, next_billing_date) VALUES
        (customer3_id, plan3_id, 'Enterprise', 'active', now() - interval '6 months', now() + interval '6 months', now() + interval '1 month');
    END IF;
END $$;

-- Örnek ödemeler
DO $$
DECLARE
    sub1_id uuid;
    sub2_id uuid;
    sub3_id uuid;
    customer1_id uuid;
    customer2_id uuid;
    customer3_id uuid;
BEGIN
    SELECT id INTO sub1_id FROM subscriptions LIMIT 1;
    SELECT id INTO sub2_id FROM subscriptions OFFSET 1 LIMIT 1;
    SELECT id INTO sub3_id FROM subscriptions OFFSET 2 LIMIT 1;
    
    SELECT customer_id INTO customer1_id FROM subscriptions WHERE id = sub1_id;
    SELECT customer_id INTO customer2_id FROM subscriptions WHERE id = sub2_id;
    SELECT customer_id INTO customer3_id FROM subscriptions WHERE id = sub3_id;
    
    INSERT INTO payments (subscription_id, customer_id, amount, status, payment_date, due_date) VALUES
    (sub1_id, customer1_id, 199.00, 'completed', now() - interval '2 months', now() - interval '2 months'),
    (sub1_id, customer1_id, 199.00, 'completed', now() - interval '1 month', now() - interval '1 month'),
    (sub1_id, customer1_id, 199.00, 'completed', now(), now()),
    (sub2_id, customer2_id, 99.00, 'completed', now() - interval '1 month', now() - interval '1 month'),
    (sub2_id, customer2_id, 99.00, 'completed', now(), now()),
    (sub3_id, customer3_id, 499.00, 'completed', now() - interval '5 months', now() - interval '5 months'),
    (sub3_id, customer3_id, 499.00, 'completed', now() - interval '4 months', now() - interval '4 months'),
    (sub3_id, customer3_id, 499.00, 'completed', now() - interval '3 months', now() - interval '3 months'),
    (sub3_id, customer3_id, 499.00, 'completed', now() - interval '2 months', now() - interval '2 months'),
    (sub3_id, customer3_id, 499.00, 'completed', now() - interval '1 month', now() - interval '1 month'),
    (sub3_id, customer3_id, 499.00, 'completed', now(), now());
END $$;

-- Örnek giderler
DO $$
DECLARE
    cat1_id uuid;
    cat2_id uuid;
    cat3_id uuid;
    cat4_id uuid;
BEGIN
    SELECT id INTO cat1_id FROM expense_categories WHERE name = 'Pazarlama';
    SELECT id INTO cat2_id FROM expense_categories WHERE name = 'Sunucu';
    SELECT id INTO cat3_id FROM expense_categories WHERE name = 'Personel';
    SELECT id INTO cat4_id FROM expense_categories WHERE name = 'Ofis';
    
    INSERT INTO expenses (category_id, title, description, amount, expense_date, vendor, status) VALUES
    (cat1_id, 'Google Ads Reklamları', 'Aylık Google Ads harcaması', 2500.00, now() - interval '1 month', 'Google', 'paid'),
    (cat1_id, 'Facebook Reklamları', 'Aylık Facebook reklam harcaması', 1800.00, now() - interval '1 month', 'Facebook', 'paid'),
    (cat2_id, 'AWS Sunucu Ücretleri', 'Aylık AWS hosting ücretleri', 1200.00, now() - interval '1 month', 'Amazon Web Services', 'paid'),
    (cat2_id, 'Domain ve SSL', 'Domain yenileme ve SSL sertifikaları', 150.00, now() - interval '1 month', 'GoDaddy', 'paid'),
    (cat3_id, 'Geliştirici Maaşı', 'Aylık geliştirici maaş ödemesi', 15000.00, now() - interval '1 month', 'Banka', 'paid'),
    (cat3_id, 'Tasarımcı Maaşı', 'Aylık tasarımcı maaş ödemesi', 12000.00, now() - interval '1 month', 'Banka', 'paid'),
    (cat4_id, 'Ofis Kirası', 'Aylık ofis kirası', 8000.00, now() - interval '1 month', 'Emlak Sahibi', 'paid'),
    (cat4_id, 'Elektrik Faturası', 'Aylık elektrik tüketimi', 450.00, now() - interval '1 month', 'Elektrik Şirketi', 'paid'),
    (cat1_id, 'Google Ads Reklamları', 'Aylık Google Ads harcaması', 2800.00, now(), 'Google', 'pending'),
    (cat2_id, 'AWS Sunucu Ücretleri', 'Aylık AWS hosting ücretleri', 1350.00, now(), 'Amazon Web Services', 'pending');
END $$;

-- Örnek promosyonlar
INSERT INTO promotions (name, description, discount_type, discount_value, start_date, end_date, usage_limit) VALUES
('Yeni Yıl İndirimi', 'Yeni yıl özel %20 indirim', 'percentage', 20.00, '2024-01-01', '2024-01-31', 100),
('Yıllık Plan İndirimi', 'Yıllık planlarda %17 indirim', 'percentage', 17.00, '2024-01-01', '2024-12-31', 1000),
('İlk Ay Bedava', 'Yeni müşteriler için ilk ay bedava', 'percentage', 100.00, '2024-01-01', '2024-12-31', 500)
ON CONFLICT DO NOTHING;

-- Örnek promosyon kullanım kayıtları
DO $$
DECLARE
    promo1_id uuid;
    promo2_id uuid;
    promo3_id uuid;
    customer1_id uuid;
    customer2_id uuid;
    customer3_id uuid;
    sub1_id uuid;
    sub2_id uuid;
    payment1_id uuid;
    payment2_id uuid;
BEGIN
    -- Promosyon ID'lerini al
    SELECT id INTO promo1_id FROM promotions WHERE name = 'Yeni Yıl İndirimi';
    SELECT id INTO promo2_id FROM promotions WHERE name = 'Yıllık Plan İndirimi';
    SELECT id INTO promo3_id FROM promotions WHERE name = 'İlk Ay Bedava';
    
    -- Müşteri ID'lerini al
    SELECT id INTO customer1_id FROM customers WHERE email = 'ahmet@example.com';
    SELECT id INTO customer2_id FROM customers WHERE email = 'ayse@example.com';
    SELECT id INTO customer3_id FROM customers WHERE email = 'mehmet@example.com';
    
    -- Abonelik ID'lerini al
    SELECT id INTO sub1_id FROM subscriptions WHERE customer_id = customer1_id LIMIT 1;
    SELECT id INTO sub2_id FROM subscriptions WHERE customer_id = customer2_id LIMIT 1;
    
    -- Ödeme ID'lerini al
    SELECT id INTO payment1_id FROM payments WHERE customer_id = customer1_id LIMIT 1;
    SELECT id INTO payment2_id FROM payments WHERE customer_id = customer2_id LIMIT 1;
    
    -- Promosyon kullanım kayıtları ekle
    INSERT INTO promotion_usage (promotion_id, customer_id, subscription_id, payment_id, discount_amount, original_amount, final_amount, usage_context, usage_reason) VALUES
    (promo1_id, customer1_id, sub1_id, payment1_id, 39.80, 199.00, 159.20, 'payment', 'Yeni yıl özel indirimi ile ödeme'),
    (promo2_id, customer2_id, sub2_id, payment2_id, 16.83, 99.00, 82.17, 'subscription', 'Yıllık plan indirimi uygulandı'),
    (promo3_id, customer3_id, NULL, NULL, 499.00, 499.00, 0.00, 'subscription', 'İlk ay bedava kampanyası'),
    (promo1_id, customer2_id, NULL, NULL, 19.80, 99.00, 79.20, 'manual', 'Manuel olarak uygulandı'),
    (promo2_id, customer1_id, NULL, NULL, 33.83, 199.00, 165.17, 'payment', 'Yıllık plan indirimi ile ödeme');
END $$;

-- Örnek bütçeler
DO $$
DECLARE
    cat1_id uuid;
    cat2_id uuid;
    cat3_id uuid;
    cat4_id uuid;
BEGIN
    SELECT id INTO cat1_id FROM expense_categories WHERE name = 'Pazarlama';
    SELECT id INTO cat2_id FROM expense_categories WHERE name = 'Sunucu';
    SELECT id INTO cat3_id FROM expense_categories WHERE name = 'Personel';
    SELECT id INTO cat4_id FROM expense_categories WHERE name = 'Ofis';
    
    INSERT INTO budgets (category_id, name, amount, period, start_date, end_date) VALUES
    (cat1_id, '2024 Pazarlama Bütçesi', 50000.00, 'yearly', '2024-01-01', '2024-12-31'),
    (cat2_id, '2024 Sunucu Bütçesi', 15000.00, 'yearly', '2024-01-01', '2024-12-31'),
    (cat3_id, '2024 Personel Bütçesi', 300000.00, 'yearly', '2024-01-01', '2024-12-31'),
    (cat4_id, '2024 Ofis Bütçesi', 100000.00, 'yearly', '2024-01-01', '2024-12-31');
END $$;

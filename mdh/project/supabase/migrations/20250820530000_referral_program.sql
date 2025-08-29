-- Referans Programı Tabloları
-- Migration: 20250820530000_referral_program.sql

-- Referans programı ayarları tablosu
CREATE TABLE IF NOT EXISTS referral_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT true,
  reward_type text DEFAULT 'percentage', -- percentage, fixed_amount, points
  reward_value decimal(10,2) NOT NULL DEFAULT 10.00,
  reward_currency text DEFAULT 'TRY',
  referrer_reward_type text DEFAULT 'percentage', -- percentage, fixed_amount, points
  referrer_reward_value decimal(10,2) NOT NULL DEFAULT 10.00,
  referee_reward_type text DEFAULT 'percentage', -- percentage, fixed_amount, points
  referee_reward_value decimal(10,2) NOT NULL DEFAULT 10.00,
  minimum_purchase_amount decimal(10,2) DEFAULT 600.00,
  maximum_rewards_per_referrer integer DEFAULT NULL,
  referral_code_length integer DEFAULT 8,
  auto_generate_codes boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Referans kodları tablosu
CREATE TABLE IF NOT EXISTS referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  max_usage integer DEFAULT NULL,
  total_earnings decimal(10,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Referans kayıtları tablosu
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  referee_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  referral_code_id uuid REFERENCES referral_codes(id) ON DELETE CASCADE,
  status text DEFAULT 'pending', -- pending, completed, cancelled, expired
  referrer_reward decimal(10,2) DEFAULT 0.00,
  referee_reward decimal(10,2) DEFAULT 0.00,
  reward_paid boolean DEFAULT false,
  reward_paid_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Referans ödülleri tablosu
CREATE TABLE IF NOT EXISTS referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid REFERENCES referrals(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  reward_type text NOT NULL, -- referrer, referee
  reward_amount decimal(10,2) NOT NULL,
  reward_currency text DEFAULT 'TRY',
  status text DEFAULT 'pending', -- pending, paid, cancelled
  payment_method text, -- credit, discount, points
  payment_reference text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Politikaları
ALTER TABLE referral_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Referral Settings politikaları
DROP POLICY IF EXISTS "Enable read access for all users" ON referral_settings;
DROP POLICY IF EXISTS "Enable insert for all users" ON referral_settings;
DROP POLICY IF EXISTS "Enable update for all users" ON referral_settings;
CREATE POLICY "Enable read access for all users" ON referral_settings FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON referral_settings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON referral_settings FOR UPDATE TO public USING (true);

-- Referral Codes politikaları
DROP POLICY IF EXISTS "Enable read access for all users" ON referral_codes;
DROP POLICY IF EXISTS "Enable insert for all users" ON referral_codes;
DROP POLICY IF EXISTS "Enable update for all users" ON referral_codes;
CREATE POLICY "Enable read access for all users" ON referral_codes FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON referral_codes FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON referral_codes FOR UPDATE TO public USING (true);

-- Referrals politikaları
DROP POLICY IF EXISTS "Enable read access for all users" ON referrals;
DROP POLICY IF EXISTS "Enable insert for all users" ON referrals;
DROP POLICY IF EXISTS "Enable update for all users" ON referrals;
CREATE POLICY "Enable read access for all users" ON referrals FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON referrals FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON referrals FOR UPDATE TO public USING (true);

-- Referral Rewards politikaları
DROP POLICY IF EXISTS "Enable read access for all users" ON referral_rewards;
DROP POLICY IF EXISTS "Enable insert for all users" ON referral_rewards;
DROP POLICY IF EXISTS "Enable update for all users" ON referral_rewards;
CREATE POLICY "Enable read access for all users" ON referral_rewards FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON referral_rewards FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON referral_rewards FOR UPDATE TO public USING (true);

-- Varsayılan referans ayarlarını ekle
INSERT INTO referral_settings (
  is_active,
  reward_type,
  reward_value,
  reward_currency,
  referrer_reward_type,
  referrer_reward_value,
  referee_reward_type,
  referee_reward_value,
  minimum_purchase_amount,
  maximum_rewards_per_referrer,
  referral_code_length,
  auto_generate_codes
) VALUES (
  true,
  'percentage',
  10.00,
  'TRY',
  'percentage',
  10.00,
  'percentage',
  10.00,
  600.00,
  NULL,
  8,
  true
) ON CONFLICT DO NOTHING;

-- Indexler
CREATE INDEX IF NOT EXISTS idx_referral_codes_customer_id ON referral_codes(customer_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_customer_id ON referral_rewards(customer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);

-- Fonksiyonlar
-- Eski sürümlerle çakışmayı önlemek için mevcut fonksiyonları kaldır
DROP FUNCTION IF EXISTS generate_referral_code(integer);
DROP FUNCTION IF EXISTS create_referral_code_for_customer(uuid);
DROP FUNCTION IF EXISTS complete_referral(uuid);

CREATE OR REPLACE FUNCTION generate_referral_code(length integer DEFAULT 8)
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer := 0;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars))::integer + 1, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Referans kodu oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_referral_code_for_customer(customer_uuid uuid)
RETURNS text AS $$
DECLARE
  new_code text;
  code_exists boolean := true;
  max_attempts integer := 10;
  attempt_count integer := 0;
BEGIN
  WHILE code_exists AND attempt_count < max_attempts LOOP
    new_code := generate_referral_code(8);
    
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = new_code) INTO code_exists;
    
    IF NOT code_exists THEN
      INSERT INTO referral_codes (customer_id, code)
      VALUES (customer_uuid, new_code);
      RETURN new_code;
    END IF;
    
    attempt_count := attempt_count + 1;
  END LOOP;
  
  RAISE EXCEPTION 'Could not generate unique referral code after % attempts', max_attempts;
END;
$$ LANGUAGE plpgsql;

-- Referans tamamlama fonksiyonu
CREATE OR REPLACE FUNCTION complete_referral(referral_uuid uuid)
RETURNS void AS $$
DECLARE
  referral_record referrals%ROWTYPE;
  settings_record referral_settings%ROWTYPE;
BEGIN
  -- Referans kaydını al
  SELECT * INTO referral_record FROM referrals WHERE id = referral_uuid;
  
  -- Ayarları al
  SELECT * INTO settings_record FROM referral_settings WHERE is_active = true LIMIT 1;
  
  IF referral_record.id IS NULL THEN
    RAISE EXCEPTION 'Referral not found';
  END IF;
  
  IF referral_record.status != 'pending' THEN
    RAISE EXCEPTION 'Referral is not in pending status';
  END IF;
  
  -- Referansı tamamla
  UPDATE referrals 
  SET status = 'completed', 
      completed_at = now(),
      referrer_reward = settings_record.referrer_reward_value,
      referee_reward = settings_record.referee_reward_value
  WHERE id = referral_uuid;
  
  -- Ödülleri oluştur
  INSERT INTO referral_rewards (referral_id, customer_id, reward_type, reward_amount, reward_currency)
  VALUES 
    (referral_uuid, referral_record.referrer_id, 'referrer', settings_record.referrer_reward_value, settings_record.reward_currency),
    (referral_uuid, referral_record.referee_id, 'referee', settings_record.referee_reward_value, settings_record.reward_currency);
  
  -- Referans kodunun kullanım sayısını artır
  UPDATE referral_codes 
  SET usage_count = usage_count + 1,
      total_earnings = total_earnings + settings_record.referrer_reward_value
  WHERE id = referral_record.referral_code_id;
END;
$$ LANGUAGE plpgsql;

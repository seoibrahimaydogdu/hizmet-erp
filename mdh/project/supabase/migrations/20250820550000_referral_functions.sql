-- Referral Program Functions and Policies
-- Migration: 20250820550000_referral_functions.sql

-- Önce mevcut fonksiyonları sil
DROP FUNCTION IF EXISTS create_referral_code_for_customer(uuid);
DROP FUNCTION IF EXISTS get_referral_stats_for_customer(uuid);
DROP FUNCTION IF EXISTS use_referral_code(text, uuid);

-- Fonksiyon: Müşteri için referans kodu oluşturma (eğer yoksa)
CREATE OR REPLACE FUNCTION create_referral_code_for_customer(customer_uuid uuid)
RETURNS referral_codes
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_length INTEGER;
  existing_code_id UUID;
  referral_settings_record referral_settings;
  created_referral_code referral_codes;
BEGIN
  -- Check if a referral code already exists for this customer
  SELECT id INTO existing_code_id FROM public.referral_codes WHERE customer_id = customer_uuid AND is_active = TRUE LIMIT 1;

  IF existing_code_id IS NOT NULL THEN
    RAISE EXCEPTION 'Bu müşteri için zaten aktif bir referans kodu mevcut.';
  END IF;

  -- Get referral code length from settings
  SELECT referral_code_length INTO code_length FROM public.referral_settings WHERE is_active = TRUE LIMIT 1;
  IF code_length IS NULL THEN
    code_length := 8; -- Default if no settings found
  END IF;

  -- Generate a unique code
  LOOP
    new_code := substr(md5(random()::text), 1, code_length);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.referral_codes WHERE code = new_code);
  END LOOP;

  -- Insert the new referral code
  INSERT INTO public.referral_codes (customer_id, code)
  VALUES (customer_uuid, new_code)
  RETURNING * INTO created_referral_code;

  RETURN created_referral_code;
END;
$$;

-- Fonksiyon: Referans istatistiklerini getirme
CREATE OR REPLACE FUNCTION get_referral_stats_for_customer(customer_uuid uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  stats json;
BEGIN
  SELECT json_build_object(
    'totalReferrals', COUNT(*),
    'completedReferrals', COUNT(*) FILTER (WHERE status = 'completed'),
    'pendingReferrals', COUNT(*) FILTER (WHERE status = 'pending'),
    'totalEarnings', COALESCE(SUM(referrer_reward), 0),
    'recentReferrals', (
      SELECT json_agg(
        json_build_object(
          'id', r.id,
          'refereeName', c.name,
          'refereeEmail', c.email,
          'status', r.status,
          'referrerReward', r.referrer_reward,
          'refereeReward', r.referee_reward,
          'createdAt', r.created_at,
          'completedAt', r.completed_at
        )
      )
      FROM referrals r
      LEFT JOIN customers c ON r.referee_id = c.id
      WHERE r.referrer_id = customer_uuid
      ORDER BY r.created_at DESC
      LIMIT 5
    )
  ) INTO stats
  FROM referrals
  WHERE referrer_id = customer_uuid;

  RETURN stats;
END;
$$;

-- Fonksiyon: Referans kodu kullanma
CREATE OR REPLACE FUNCTION use_referral_code(code_text text, referee_uuid uuid)
RETURNS referrals
LANGUAGE plpgsql
AS $$
DECLARE
  referral_code_record referral_codes;
  referrer_uuid uuid;
  new_referral referrals;
  settings_record referral_settings;
BEGIN
  -- Check if code exists and is active
  SELECT * INTO referral_code_record 
  FROM referral_codes 
  WHERE code = code_text AND is_active = TRUE;

  IF referral_code_record IS NULL THEN
    RAISE EXCEPTION 'Geçersiz veya aktif olmayan referans kodu.';
  END IF;

  -- Check if referee is not the same as referrer
  IF referral_code_record.customer_id = referee_uuid THEN
    RAISE EXCEPTION 'Kendi referans kodunuzu kullanamazsınız.';
  END IF;

  -- Check if referral already exists
  IF EXISTS (SELECT 1 FROM referrals WHERE referrer_id = referral_code_record.customer_id AND referee_id = referee_uuid) THEN
    RAISE EXCEPTION 'Bu kullanıcı zaten referans edilmiş.';
  END IF;

  -- Get referral settings
  SELECT * INTO settings_record FROM referral_settings WHERE is_active = TRUE LIMIT 1;
  IF settings_record IS NULL THEN
    RAISE EXCEPTION 'Referans programı ayarları bulunamadı.';
  END IF;

  -- Create new referral
  INSERT INTO referrals (
    referrer_id, 
    referee_id, 
    referral_code_id,
    referrer_reward,
    referee_reward
  ) VALUES (
    referral_code_record.customer_id,
    referee_uuid,
    referral_code_record.id,
    settings_record.referrer_reward_value,
    settings_record.referee_reward_value
  ) RETURNING * INTO new_referral;

  -- Update usage count
  UPDATE referral_codes 
  SET usage_count = usage_count + 1
  WHERE id = referral_code_record.id;

  RETURN new_referral;
END;
$$;

-- Varsayılan referans ayarlarını ekleme
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
  referral_code_length
) VALUES (
  true,
  'percentage',
  10.00,
  'TRY',
  'percentage',
  5.00,
  'percentage',
  5.00,
  0.00,
  10,
  8
) ON CONFLICT DO NOTHING;

-- RLS Policies for referral_settings (if not already created)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_settings' AND policyname = 'Enable read access for all users') THEN
    ALTER TABLE referral_settings ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Enable read access for all users" ON referral_settings FOR SELECT USING (true);
    CREATE POLICY "Enable insert for authenticated users" ON referral_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Enable update for authenticated users" ON referral_settings FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable delete for authenticated users" ON referral_settings FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- RLS Policies for referral_codes (if not already created)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_codes' AND policyname = 'Allow authenticated users to read their own codes') THEN
    ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow authenticated users to read their own codes" ON referral_codes FOR SELECT USING (auth.uid() = customer_id);
    CREATE POLICY "Allow authenticated users to insert their own codes" ON referral_codes FOR INSERT WITH CHECK (auth.uid() = customer_id);
    CREATE POLICY "Allow authenticated users to update their own codes" ON referral_codes FOR UPDATE USING (auth.uid() = customer_id);
    CREATE POLICY "Allow authenticated users to delete their own codes" ON referral_codes FOR DELETE USING (auth.uid() = customer_id);
    -- Admin policy for referral_codes (simplified - no is_admin check)
    CREATE POLICY "Admins can manage all referral codes" ON referral_codes
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- RLS Policies for referrals (if not already created)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'Allow authenticated users to read their own referrals') THEN
    ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow authenticated users to read their own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
    CREATE POLICY "Allow authenticated users to insert referrals" ON referrals FOR INSERT WITH CHECK (auth.uid() = referee_id);
    CREATE POLICY "Allow authenticated users to update their own referrals" ON referrals FOR UPDATE USING (auth.uid() = referee_id OR auth.uid() = referrer_id);
    CREATE POLICY "Allow authenticated users to delete their own referrals" ON referrals FOR DELETE USING (auth.uid() = referee_id OR auth.uid() = referrer_id);
    -- Admin policy for referrals (simplified - no is_admin check)
    CREATE POLICY "Admins can manage all referrals" ON referrals
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

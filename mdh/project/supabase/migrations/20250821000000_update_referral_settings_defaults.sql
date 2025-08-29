-- Referral settings varsayılan değerlerini güncelle
-- Tüm referans ödüllerini %10 yap ve sınırsız kullanım ayarla

-- Mevcut ayarları güncelle
UPDATE referral_settings 
SET 
  referrer_reward_value = 10.00,
  referee_reward_value = 10.00,
  maximum_rewards_per_referrer = -1
WHERE is_active = true;

-- Eğer hiç ayar yoksa varsayılan ayar oluştur
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
) 
SELECT 
  true,
  'percentage',
  10.00,
  'TRY',
  'percentage',
  10.00,
  'percentage',
  10.00,
  0.00,
  -1,
  8
WHERE NOT EXISTS (SELECT 1 FROM referral_settings WHERE is_active = true);

-- Mevcut referral kodlarını sınırsız yap
UPDATE referral_codes 
SET max_usage = -1 
WHERE max_usage IS NULL OR max_usage = 0;

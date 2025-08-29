-- Tüm referans kodlarını sınırsız yap
-- Mevcut tüm referral kodlarının max_usage değerini -1 (sınırsız) yap

UPDATE referral_codes 
SET max_usage = -1 
WHERE max_usage != -1;

-- Yeni oluşturulacak referral kodları için varsayılan değeri -1 yap
-- Bu migration'ı çalıştırdıktan sonra yeni kodlar otomatik olarak sınırsız olacak

-- Referral settings'de de maximum_rewards_per_referrer'ı sınırsız yap
UPDATE referral_settings 
SET maximum_rewards_per_referrer = -1 
WHERE maximum_rewards_per_referrer != -1;

-- Ödeme durumları için örnek veriler ve SQL sorguları

-- 1. BAŞARILI ÖDEME (COMPLETED) - Örnek veri ekleme
INSERT INTO payments (
  id,
  customer_id,
  amount,
  currency,
  status,
  description,
  payment_method,
  invoice_number,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM customers WHERE email = 'test-try@example.com' LIMIT 1),
  1500.00,
  'TRY',
  'completed',
  'Aylık abonelik ödemesi',
  'credit_card',
  'INV-2024-001',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '1 hour 55 minutes'
) ON CONFLICT DO NOTHING;

-- 2. BEKLEYEN ÖDEME (PENDING) - Örnek veri ekleme
INSERT INTO payments (
  id,
  customer_id,
  amount,
  currency,
  status,
  description,
  payment_method,
  invoice_number,
  created_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM customers WHERE email = 'test-try@example.com' LIMIT 1),
  750.50,
  'TRY',
  'pending',
  'Ek hizmet ödemesi',
  'bank_transfer',
  'INV-2024-002',
  NOW() - INTERVAL '30 minutes'
) ON CONFLICT DO NOTHING;

-- 3. BAŞARISIZ ÖDEME (FAILED) - Örnek veri ekleme
INSERT INTO payments (
  id,
  customer_id,
  amount,
  currency,
  status,
  description,
  payment_method,
  invoice_number,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM customers WHERE email = 'test-try@example.com' LIMIT 1),
  2500.00,
  'TRY',
  'failed',
  'Yıllık paket ödemesi',
  'credit_card',
  'INV-2024-003',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '23 hours 30 minutes'
) ON CONFLICT DO NOTHING;

-- ========================================
-- ÖDEME DURUMLARINI GÖRÜNTÜLEME SORGULARI
-- ========================================

-- 1. Tüm ödemeleri durumlarına göre listele
SELECT 
  p.id,
  p.invoice_number,
  p.amount,
  p.currency,
  p.status,
  p.description,
  p.payment_method,
  p.created_at,
  p.updated_at,
  c.name as customer_name,
  c.email as customer_email
FROM payments p
JOIN customers c ON p.customer_id = c.id
WHERE c.email = 'test-try@example.com'
ORDER BY p.created_at DESC;

-- 2. Sadece tamamlanan ödemeler
SELECT 
  p.invoice_number,
  p.amount,
  p.currency,
  p.description,
  p.created_at,
  p.updated_at
FROM payments p
JOIN customers c ON p.customer_id = c.id
WHERE c.email = 'test-try@example.com' 
  AND p.status = 'completed'
ORDER BY p.created_at DESC;

-- 3. Sadece bekleyen ödemeler
SELECT 
  p.invoice_number,
  p.amount,
  p.currency,
  p.description,
  p.created_at
FROM payments p
JOIN customers c ON p.customer_id = c.id
WHERE c.email = 'test-try@example.com' 
  AND p.status = 'pending'
ORDER BY p.created_at DESC;

-- 4. Sadece başarısız ödemeler
SELECT 
  p.invoice_number,
  p.amount,
  p.currency,
  p.description,
  p.created_at,
  p.updated_at
FROM payments p
JOIN customers c ON p.customer_id = c.id
WHERE c.email = 'test-try@example.com' 
  AND p.status = 'failed'
ORDER BY p.created_at DESC;

-- 5. Ödeme istatistikleri
SELECT 
  COUNT(*) as total_payments,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
  SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_completed_amount,
  SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending_amount
FROM payments p
JOIN customers c ON p.customer_id = c.id
WHERE c.email = 'test-try@example.com';

-- ========================================
-- ÖDEME DURUMU GÜNCELLEME SORGULARI
-- ========================================

-- 1. Bekleyen ödemeyi tamamlandı olarak güncelle
UPDATE payments 
SET 
  status = 'completed',
  updated_at = NOW()
WHERE 
  customer_id = (SELECT id FROM customers WHERE email = 'test-try@example.com' LIMIT 1)
  AND status = 'pending'
  AND invoice_number = 'INV-2024-002';

-- 2. Bekleyen ödemeyi başarısız olarak güncelle
UPDATE payments 
SET 
  status = 'failed',
  updated_at = NOW()
WHERE 
  customer_id = (SELECT id FROM customers WHERE email = 'test-try@example.com' LIMIT 1)
  AND status = 'pending'
  AND invoice_number = 'INV-2024-002';

-- 3. Başarısız ödemeyi tekrar deneme için pending yap
UPDATE payments 
SET 
  status = 'pending',
  updated_at = NOW()
WHERE 
  customer_id = (SELECT id FROM customers WHERE email = 'test-try@example.com' LIMIT 1)
  AND status = 'failed'
  AND invoice_number = 'INV-2024-003';

-- ========================================
-- YENİ ÖDEME EKLEME SORGULARI
-- ========================================

-- 1. Yeni başarılı ödeme ekle
INSERT INTO payments (
  id,
  customer_id,
  amount,
  currency,
  status,
  description,
  payment_method,
  invoice_number,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM customers WHERE email = 'test-try@example.com' LIMIT 1),
  1200.00,
  'TRY',
  'completed',
  'Premium paket ödemesi',
  'credit_card',
  'INV-2024-004',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- 2. Yeni bekleyen ödeme ekle
INSERT INTO payments (
  id,
  customer_id,
  amount,
  currency,
  status,
  description,
  payment_method,
  invoice_number,
  created_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM customers WHERE email = 'test-try@example.com' LIMIT 1),
  850.75,
  'TRY',
  'pending',
  'Ek depolama alanı',
  'bank_transfer',
  'INV-2024-005',
  NOW()
) ON CONFLICT DO NOTHING;

-- 3. Yeni başarısız ödeme ekle
INSERT INTO payments (
  id,
  customer_id,
  amount,
  currency,
  status,
  description,
  payment_method,
  invoice_number,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM customers WHERE email = 'test-try@example.com' LIMIT 1),
  3000.00,
  'TRY',
  'failed',
  'Kurumsal paket ödemesi',
  'credit_card',
  'INV-2024-006',
  NOW() - INTERVAL '10 minutes',
  NOW() - INTERVAL '5 minutes'
) ON CONFLICT DO NOTHING;

-- ========================================
-- TEMİZLİK SORGULARI (Test verilerini silmek için)
-- ========================================

-- Belirli test ödemelerini sil
DELETE FROM payments 
WHERE invoice_number IN ('INV-2024-001', 'INV-2024-002', 'INV-2024-003', 'INV-2024-004', 'INV-2024-005', 'INV-2024-006')
AND customer_id = (SELECT id FROM customers WHERE email = 'test-try@example.com' LIMIT 1);

-- Tüm test ödemelerini sil
DELETE FROM payments 
WHERE customer_id = (SELECT id FROM customers WHERE email = 'test-try@example.com' LIMIT 1);

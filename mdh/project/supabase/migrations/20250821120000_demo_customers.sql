-- Demo Müşteriler Migration
-- Migration: 20250821120000_demo_customers.sql

-- Önce demo subscription plans ekle (eğer yoksa)
INSERT INTO subscription_plans (name, description, price, billing_cycle, features, is_active, created_at, updated_at) VALUES
('Basic', 'Temel özellikler ile başlangıç planı', 99.99, 'monthly', '["Temel destek", "Email desteği", "5GB depolama"]', true, NOW(), NOW()),
('Pro', 'Profesyonel kullanıcılar için gelişmiş plan', 199.99, 'monthly', '["Öncelikli destek", "Telefon desteği", "25GB depolama", "Gelişmiş raporlar"]', true, NOW(), NOW()),
('Premium', 'Kurumsal müşteriler için tam özellikli plan', 399.99, 'monthly', '["7/24 destek", "Özel hesap yöneticisi", "100GB depolama", "Özel entegrasyonlar"]', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Demo müşteriler ekle
INSERT INTO customers (name, email, phone, company, plan, satisfaction_score, total_tickets, currency, created_at, updated_at) VALUES
('Ahmet Yılmaz', 'ahmet.yilmaz@example.com', '+905551234567', 'TechCorp A.Ş.', 'premium', 4, 5, 'TRY', NOW(), NOW()),
('Fatma Demir', 'fatma.demir@example.com', '+905551234568', 'Digital Solutions Ltd.', 'basic', 3, 3, 'TRY', NOW(), NOW()),
('Mehmet Kaya', 'mehmet.kaya@example.com', '+905551234569', 'Innovation Co.', 'premium', 5, 8, 'USD', NOW(), NOW()),
('Ayşe Özkan', 'ayse.ozkan@example.com', '+905551234570', 'StartupHub', 'basic', 4, 2, 'TRY', NOW(), NOW()),
('Ali Çelik', 'ali.celik@example.com', '+905551234571', 'FutureTech', 'premium', 3, 6, 'EUR', NOW(), NOW()),
('Zeynep Arslan', 'zeynep.arslan@example.com', '+905551234572', 'Smart Solutions', 'basic', 5, 4, 'TRY', NOW(), NOW()),
('Mustafa Şahin', 'mustafa.sahin@example.com', '+905551234573', 'DataFlow Inc.', 'premium', 4, 7, 'USD', NOW(), NOW()),
('Elif Yıldız', 'elif.yildiz@example.com', '+905551234574', 'CloudTech', 'basic', 3, 1, 'TRY', NOW(), NOW()),
('Hasan Koç', 'hasan.koc@example.com', '+905551234575', 'WebMaster Pro', 'premium', 5, 9, 'TRY', NOW(), NOW()),
('Selin Aydın', 'selin.aydin@example.com', '+905551234576', 'Digital Agency', 'basic', 4, 3, 'EUR', NOW(), NOW());

-- Demo talepler ekle (müşteriler için)
INSERT INTO tickets (title, description, status, priority, category, customer_id, agent_id, created_at, updated_at) VALUES
('Web sitesi yavaş açılıyor', 'Web sitemiz son günlerde çok yavaş açılıyor. Acil çözüm gerekiyor.', 'open', 'high', 'technical', (SELECT id FROM customers WHERE email = 'ahmet.yilmaz@example.com' LIMIT 1), NULL, NOW(), NOW()),
('Ödeme sistemi hatası', 'Ödeme yaparken sistem hata veriyor. Müşterilerimiz şikayet ediyor.', 'in_progress', 'critical', 'billing', (SELECT id FROM customers WHERE email = 'fatma.demir@example.com' LIMIT 1), NULL, NOW(), NOW()),
('Mobil uygulama güncelleme', 'Mobil uygulamamızın yeni özelliklerle güncellenmesi gerekiyor.', 'open', 'medium', 'feature_request', (SELECT id FROM customers WHERE email = 'mehmet.kaya@example.com' LIMIT 1), NULL, NOW(), NOW()),
('Veri yedekleme sorunu', 'Verilerimiz otomatik yedeklenmiyor. Manuel yedekleme yapmamız gerekiyor.', 'resolved', 'low', 'technical', (SELECT id FROM customers WHERE email = 'ayse.ozkan@example.com' LIMIT 1), NULL, NOW(), NOW()),
('Kullanıcı arayüzü iyileştirme', 'Kullanıcı arayüzünde bazı iyileştirmeler yapmak istiyoruz.', 'open', 'medium', 'feature_request', (SELECT id FROM customers WHERE email = 'ali.celik@example.com' LIMIT 1), NULL, NOW(), NOW());

-- Demo ödemeler ekle
INSERT INTO payments (customer_id, subscription_id, amount, payment_method, status, payment_date, created_at) VALUES
((SELECT id FROM customers WHERE email = 'ahmet.yilmaz@example.com' LIMIT 1), NULL, 299.99, 'credit_card', 'completed', NOW(), NOW()),
((SELECT id FROM customers WHERE email = 'fatma.demir@example.com' LIMIT 1), NULL, 199.99, 'bank_transfer', 'completed', NOW(), NOW()),
((SELECT id FROM customers WHERE email = 'mehmet.kaya@example.com' LIMIT 1), NULL, 399.99, 'credit_card', 'completed', NOW(), NOW()),
((SELECT id FROM customers WHERE email = 'ayse.ozkan@example.com' LIMIT 1), NULL, 149.99, 'paypal', 'completed', NOW(), NOW()),
((SELECT id FROM customers WHERE email = 'ali.celik@example.com' LIMIT 1), NULL, 249.99, 'credit_card', 'pending', NOW(), NOW());

-- Demo abonelikler ekle
INSERT INTO subscriptions (customer_id, plan_id, status, start_date, end_date, created_at, updated_at) VALUES
((SELECT id FROM customers WHERE email = 'ahmet.yilmaz@example.com' LIMIT 1), (SELECT id FROM subscription_plans WHERE name = 'Premium' LIMIT 1), 'active', NOW(), NOW() + INTERVAL '1 year', NOW(), NOW()),
((SELECT id FROM customers WHERE email = 'fatma.demir@example.com' LIMIT 1), (SELECT id FROM subscription_plans WHERE name = 'Basic' LIMIT 1), 'active', NOW(), NOW() + INTERVAL '1 year', NOW(), NOW()),
((SELECT id FROM customers WHERE email = 'mehmet.kaya@example.com' LIMIT 1), (SELECT id FROM subscription_plans WHERE name = 'Premium' LIMIT 1), 'active', NOW(), NOW() + INTERVAL '1 year', NOW(), NOW()),
((SELECT id FROM customers WHERE email = 'ayse.ozkan@example.com' LIMIT 1), (SELECT id FROM subscription_plans WHERE name = 'Basic' LIMIT 1), 'active', NOW(), NOW() + INTERVAL '1 year', NOW(), NOW()),
((SELECT id FROM customers WHERE email = 'ali.celik@example.com' LIMIT 1), (SELECT id FROM subscription_plans WHERE name = 'Premium' LIMIT 1), 'trial', NOW(), NOW() + INTERVAL '30 days', NOW(), NOW());

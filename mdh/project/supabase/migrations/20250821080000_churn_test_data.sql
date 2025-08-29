-- Churn analizi için test verileri

-- Örnek müşteriler ekle
INSERT INTO customers (id, name, email, phone, company, plan, satisfaction_score, total_tickets, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Mehmet Özkan', 'mehmet@example.com', '+90 555 123 4567', 'TechCorp', 'Pro', 3, 15, '2024-06-01 10:00:00'),
('22222222-2222-2222-2222-222222222222', 'Ayşe Demir', 'ayse@example.com', '+90 555 234 5678', 'DesignStudio', 'Basic', 2, 8, '2024-07-15 14:30:00'),
('33333333-3333-3333-3333-333333333333', 'Ali Kaya', 'ali@example.com', '+90 555 345 6789', 'MarketingPro', 'Premium', 4, 25, '2024-05-20 09:15:00'),
('44444444-4444-4444-4444-444444444444', 'Zeynep Yıldız', 'zeynep@example.com', '+90 555 456 7890', 'StartupXYZ', 'Pro', 6, 12, '2024-08-10 16:45:00'),
('55555555-5555-5555-5555-555555555555', 'Ahmet Şahin', 'ahmet@example.com', '+90 555 567 8901', 'ConsultingCo', 'Professional', 8, 30, '2024-09-01 11:20:00'),
('66666666-6666-6666-6666-666666666666', 'Fatma Çelik', 'fatma@example.com', '+90 555 678 9012', 'RetailStore', 'Basic', 5, 5, '2024-07-01 13:10:00'),
('77777777-7777-7777-7777-777777777777', 'Mustafa Arslan', 'mustafa@example.com', '+90 555 789 0123', 'ManufacturingInc', 'Premium', 7, 18, '2024-06-15 15:30:00'),
('88888888-8888-8888-8888-888888888888', 'Elif Koç', 'elif@example.com', '+90 555 890 1234', 'ServiceProvider', 'Pro', 9, 22, '2024-08-20 10:45:00'),
('99999999-9999-9999-9999-999999999999', 'Hasan Yılmaz', 'hasan@example.com', '+90 555 901 2345', 'TechStartup', 'Basic', 4, 3, '2024-09-10 12:00:00'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Selin Özkan', 'selin@example.com', '+90 555 012 3456', 'CreativeAgency', 'Professional', 6, 16, '2024-07-20 14:15:00')
ON CONFLICT (id) DO NOTHING;

-- Abonelik paketleri ekle
INSERT INTO subscription_plans (id, name, description, price, billing_cycle, features, is_active) VALUES
('plan-basic-001', 'Basic', 'Temel özellikler', 99.00, 'monthly', '["Dashboard", "Müşteri Yönetimi", "Raporlar"]', true),
('plan-pro-001', 'Pro', 'Gelişmiş özellikler', 199.00, 'monthly', '["Dashboard", "Müşteri Yönetimi", "Raporlar", "Analitik", "Canlı Destek"]', true),
('plan-professional-001', 'Professional', 'Profesyonel özellikler', 299.00, 'monthly', '["Dashboard", "Müşteri Yönetimi", "Raporlar", "Analitik", "Canlı Destek", "API Entegrasyonu"]', true),
('plan-premium-001', 'Premium', 'Premium özellikler', 399.00, 'monthly', '["Dashboard", "Müşteri Yönetimi", "Raporlar", "Analitik", "Canlı Destek", "API Entegrasyonu", "Otomasyonlar"]', true)
ON CONFLICT (id) DO NOTHING;

-- Aktif abonelikler ekle
INSERT INTO subscriptions (id, customer_id, plan_id, plan_name, status, start_date, end_date, next_billing_date, auto_renew, created_at, updated_at) VALUES
('sub-active-001', '55555555-5555-5555-5555-555555555555', 'plan-professional-001', 'Professional', 'active', '2024-09-01 11:20:00', '2024-10-01 11:20:00', '2024-10-01 11:20:00', true, '2024-09-01 11:20:00', '2024-09-01 11:20:00'),
('sub-active-002', '77777777-7777-7777-7777-777777777777', 'plan-premium-001', 'Premium', 'active', '2024-06-15 15:30:00', '2024-10-15 15:30:00', '2024-10-15 15:30:00', true, '2024-06-15 15:30:00', '2024-06-15 15:30:00'),
('sub-active-003', '88888888-8888-8888-8888-888888888888', 'plan-pro-001', 'Pro', 'active', '2024-08-20 10:45:00', '2024-10-20 10:45:00', '2024-10-20 10:45:00', true, '2024-08-20 10:45:00', '2024-08-20 10:45:00'),
('sub-active-004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'plan-professional-001', 'Professional', 'active', '2024-07-20 14:15:00', '2024-10-20 14:15:00', '2024-10-20 14:15:00', true, '2024-07-20 14:15:00', '2024-07-20 14:15:00')
ON CONFLICT (id) DO NOTHING;

-- İptal edilmiş abonelikler (churned users) ekle
INSERT INTO subscriptions (id, customer_id, plan_id, plan_name, status, start_date, end_date, next_billing_date, auto_renew, created_at, updated_at) VALUES
('sub-cancelled-001', '11111111-1111-1111-1111-111111111111', 'plan-pro-001', 'Pro', 'cancelled', '2024-06-01 10:00:00', '2024-07-01 10:00:00', '2024-07-01 10:00:00', false, '2024-06-01 10:00:00', '2024-12-15 14:30:00'),
('sub-cancelled-002', '22222222-2222-2222-2222-222222222222', 'plan-basic-001', 'Basic', 'cancelled', '2024-07-15 14:30:00', '2024-08-15 14:30:00', '2024-08-15 14:30:00', false, '2024-07-15 14:30:00', '2024-12-18 16:45:00'),
('sub-cancelled-003', '33333333-3333-3333-3333-333333333333', 'plan-premium-001', 'Premium', 'cancelled', '2024-05-20 09:15:00', '2024-08-20 09:15:00', '2024-08-20 09:15:00', false, '2024-05-20 09:15:00', '2024-12-20 11:20:00'),
('sub-cancelled-004', '44444444-4444-4444-4444-444444444444', 'plan-pro-001', 'Pro', 'cancelled', '2024-08-10 16:45:00', '2024-09-10 16:45:00', '2024-09-10 16:45:00', false, '2024-08-10 16:45:00', '2024-12-22 09:30:00'),
('sub-cancelled-005', '66666666-6666-6666-6666-666666666666', 'plan-basic-001', 'Basic', 'cancelled', '2024-07-01 13:10:00', '2024-08-01 13:10:00', '2024-08-01 13:10:00', false, '2024-07-01 13:10:00', '2024-12-25 15:45:00'),
('sub-cancelled-006', '99999999-9999-9999-9999-999999999999', 'plan-basic-001', 'Basic', 'cancelled', '2024-09-10 12:00:00', '2024-10-10 12:00:00', '2024-10-10 12:00:00', false, '2024-09-10 12:00:00', '2024-12-28 13:20:00')
ON CONFLICT (id) DO NOTHING;

-- Ödeme kayıtları ekle
INSERT INTO payments (id, subscription_id, customer_id, amount, currency, payment_method, status, payment_date, created_at) VALUES
('pay-001', 'sub-cancelled-001', '11111111-1111-1111-1111-111111111111', 199.00, 'TRY', 'credit_card', 'completed', '2024-06-01 10:00:00', '2024-06-01 10:00:00'),
('pay-002', 'sub-cancelled-002', '22222222-2222-2222-2222-222222222222', 99.00, 'TRY', 'credit_card', 'completed', '2024-07-15 14:30:00', '2024-07-15 14:30:00'),
('pay-003', 'sub-cancelled-003', '33333333-3333-3333-3333-333333333333', 399.00, 'TRY', 'credit_card', 'completed', '2024-05-20 09:15:00', '2024-05-20 09:15:00'),
('pay-004', 'sub-cancelled-004', '44444444-4444-4444-4444-444444444444', 199.00, 'TRY', 'credit_card', 'completed', '2024-08-10 16:45:00', '2024-08-10 16:45:00'),
('pay-005', 'sub-cancelled-005', '66666666-6666-6666-6666-666666666666', 99.00, 'TRY', 'credit_card', 'failed', '2024-07-01 13:10:00', '2024-07-01 13:10:00'),
('pay-006', 'sub-cancelled-006', '99999999-9999-9999-9999-999999999999', 99.00, 'TRY', 'credit_card', 'completed', '2024-09-10 12:00:00', '2024-09-10 12:00:00'),
('pay-007', 'sub-active-001', '55555555-5555-5555-5555-555555555555', 299.00, 'TRY', 'credit_card', 'completed', '2024-09-01 11:20:00', '2024-09-01 11:20:00'),
('pay-008', 'sub-active-002', '77777777-7777-7777-7777-777777777777', 399.00, 'TRY', 'credit_card', 'completed', '2024-06-15 15:30:00', '2024-06-15 15:30:00'),
('pay-009', 'sub-active-003', '88888888-8888-8888-8888-888888888888', 199.00, 'TRY', 'credit_card', 'completed', '2024-08-20 10:45:00', '2024-08-20 10:45:00'),
('pay-010', 'sub-active-004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 299.00, 'TRY', 'credit_card', 'completed', '2024-07-20 14:15:00', '2024-07-20 14:15:00')
ON CONFLICT (id) DO NOTHING;

-- Talep kayıtları ekle
INSERT INTO tickets (id, title, description, status, priority, category, customer_id, created_at, resolved_at, satisfaction_rating) VALUES
('ticket-001', 'Sistem Hatası', 'Dashboard yüklenmiyor', 'resolved', 'high', 'technical', '11111111-1111-1111-1111-111111111111', '2024-11-01 10:00:00', '2024-11-02 14:00:00', 3),
('ticket-002', 'Özellik Talebi', 'Yeni rapor özelliği istiyorum', 'resolved', 'medium', 'feature_request', '11111111-1111-1111-1111-111111111111', '2024-11-05 09:00:00', '2024-11-07 16:00:00', 4),
('ticket-003', 'Kullanım Sorunu', 'Nasıl kullanacağımı anlayamıyorum', 'resolved', 'low', 'general', '22222222-2222-2222-2222-222222222222', '2024-11-10 11:00:00', '2024-11-12 10:00:00', 2),
('ticket-004', 'Performans Sorunu', 'Sistem çok yavaş', 'resolved', 'high', 'technical', '33333333-3333-3333-3333-333333333333', '2024-11-15 14:00:00', '2024-11-16 09:00:00', 4),
('ticket-005', 'Fiyatlandırma', 'Fiyat çok yüksek', 'resolved', 'medium', 'billing', '44444444-4444-4444-4444-444444444444', '2024-11-20 16:00:00', '2024-11-22 11:00:00', 6),
('ticket-006', 'Teknik Destek', 'API entegrasyonu sorunu', 'resolved', 'high', 'technical', '55555555-5555-5555-5555-555555555555', '2024-12-01 08:00:00', '2024-12-03 15:00:00', 8),
('ticket-007', 'Özellik Eksikliği', 'Basic plan çok sınırlı', 'resolved', 'medium', 'feature_request', '66666666-6666-6666-6666-666666666666', '2024-11-25 13:00:00', '2024-11-27 10:00:00', 5),
('ticket-008', 'Sistem Hatası', 'Veri kaybı yaşadım', 'resolved', 'high', 'technical', '77777777-7777-7777-7777-777777777777', '2024-12-05 10:00:00', '2024-12-06 14:00:00', 7),
('ticket-009', 'Kullanım Sorunu', 'Raporları nasıl oluşturacağım', 'resolved', 'low', 'general', '88888888-8888-8888-8888-888888888888', '2024-12-10 12:00:00', '2024-12-12 09:00:00', 9),
('ticket-010', 'Özellik Talebi', 'Mobil uygulama istiyorum', 'resolved', 'medium', 'feature_request', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2024-12-15 15:00:00', '2024-12-17 11:00:00', 6)
ON CONFLICT (id) DO NOTHING;

-- Talep mesajları ekle
INSERT INTO ticket_messages (id, ticket_id, sender_id, sender_type, content, created_at) VALUES
('msg-001', 'ticket-001', '11111111-1111-1111-1111-111111111111', 'customer', 'Dashboard yüklenmiyor, yardım eder misiniz?', '2024-11-01 10:00:00'),
('msg-002', 'ticket-001', 'agent-001', 'agent', 'Sorununuzu inceliyoruz, kısa sürede çözülecek.', '2024-11-01 11:00:00'),
('msg-003', 'ticket-002', '11111111-1111-1111-1111-111111111111', 'customer', 'Yeni rapor özelliği ekleyebilir misiniz?', '2024-11-05 09:00:00'),
('msg-004', 'ticket-003', '22222222-2222-2222-2222-222222222222', 'customer', 'Sistemi nasıl kullanacağımı anlayamıyorum', '2024-11-10 11:00:00'),
('msg-005', 'ticket-004', '33333333-3333-3333-3333-333333333333', 'customer', 'Sistem çok yavaş çalışıyor', '2024-11-15 14:00:00'),
('msg-006', 'ticket-005', '44444444-4444-4444-4444-444444444444', 'customer', 'Fiyatlar çok yüksek, indirim yapabilir misiniz?', '2024-11-20 16:00:00'),
('msg-007', 'ticket-006', '55555555-5555-5555-5555-555555555555', 'customer', 'API entegrasyonunda sorun yaşıyorum', '2024-12-01 08:00:00'),
('msg-008', 'ticket-007', '66666666-6666-6666-6666-666666666666', 'customer', 'Basic plan çok sınırlı, daha fazla özellik istiyorum', '2024-11-25 13:00:00'),
('msg-009', 'ticket-008', '77777777-7777-7777-7777-777777777777', 'customer', 'Veri kaybı yaşadım, acil yardım gerekli', '2024-12-05 10:00:00'),
('msg-010', 'ticket-009', '88888888-8888-8888-8888-888888888888', 'customer', 'Raporları nasıl oluşturacağım?', '2024-12-10 12:00:00'),
('msg-011', 'ticket-010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'customer', 'Mobil uygulama ne zaman gelecek?', '2024-12-15 15:00:00')
ON CONFLICT (id) DO NOTHING;

-- Temsilci ekle
INSERT INTO agents (id, name, email, role, status, performance_score, total_resolved, created_at) VALUES
('agent-001', 'Ahmet Yılmaz', 'ahmet.agent@example.com', 'agent', 'online', 85, 150, '2024-01-01 09:00:00')
ON CONFLICT (id) DO NOTHING;

-- Örnek aktivite logları ekle
INSERT INTO system_logs (action, details, ip_address, created_at) VALUES
('customer_created', '{"customer_id": "550e8400-e29b-41d4-a716-446655440000", "name": "Ahmet Yılmaz", "email": "ahmet@example.com"}', 'admin_panel', NOW() - INTERVAL '30 days'),
('ticket_created', '{"customer_id": "550e8400-e29b-41d4-a716-446655440000", "title": "Giriş sorunu", "description": "Sisteme giriş yapamıyorum"}', 'admin_panel', NOW() - INTERVAL '25 days'),
('ticket_resolved', '{"customer_id": "550e8400-e29b-41d4-a716-446655440000", "title": "Giriş sorunu", "resolution": "Şifre sıfırlandı"}', 'admin_panel', NOW() - INTERVAL '20 days'),
('payment_created', '{"customer_id": "550e8400-e29b-41d4-a716-446655440000", "amount": 699.99, "payment_method": "credit_card"}', 'admin_panel', NOW() - INTERVAL '15 days'),
('subscription_created', '{"customer_id": "550e8400-e29b-41d4-a716-446655440000", "plan": "Premium", "price": 699.99}', 'admin_panel', NOW() - INTERVAL '10 days'),
('ticket_created', '{"customer_id": "550e8400-e29b-41d4-a716-446655440000", "title": "Fatura hatası", "description": "Faturamda yanlış tutar görünüyor"}', 'admin_panel', NOW() - INTERVAL '5 days'),
('customer_updated', '{"customer_id": "550e8400-e29b-41d4-a716-446655440000", "field": "phone", "old_value": null, "new_value": "+90 555 123 4567"}', 'admin_panel', NOW() - INTERVAL '2 days'),
('payment_updated', '{"customer_id": "550e8400-e29b-41d4-a716-446655440000", "amount": 799.99, "reason": "Plan yükseltme"}', 'admin_panel', NOW() - INTERVAL '1 day');

-- Diğer müşteriler için de örnek aktiviteler
INSERT INTO system_logs (action, details, ip_address, created_at) VALUES
('customer_created', '{"customer_id": "550e8400-e29b-41d4-a716-446655440001", "name": "Ayşe Demir", "email": "ayse@example.com"}', 'admin_panel', NOW() - INTERVAL '45 days'),
('ticket_created', '{"customer_id": "550e8400-e29b-41d4-a716-446655440001", "title": "Özellik talebi", "description": "Yeni rapor özelliği eklenebilir mi?"}', 'admin_panel', NOW() - INTERVAL '40 days'),
('payment_created', '{"customer_id": "550e8400-e29b-41d4-a716-446655440001", "amount": 199.99, "payment_method": "bank_transfer"}', 'admin_panel', NOW() - INTERVAL '35 days'),
('subscription_updated', '{"customer_id": "550e8400-e29b-41d4-a716-446655440001", "plan": "Basic", "price": 199.99}', 'admin_panel', NOW() - INTERVAL '30 days');

-- Üçüncü müşteri için aktiviteler
INSERT INTO system_logs (action, details, ip_address, created_at) VALUES
('customer_created', '{"customer_id": "550e8400-e29b-41d4-a716-446655440002", "name": "Mehmet Kaya", "email": "mehmet@example.com"}', 'admin_panel', NOW() - INTERVAL '60 days'),
('ticket_created', '{"customer_id": "550e8400-e29b-41d4-a716-446655440002", "title": "Performans sorunu", "description": "Sistem çok yavaş çalışıyor"}', 'admin_panel', NOW() - INTERVAL '55 days'),
('ticket_resolved', '{"customer_id": "550e8400-e29b-41d4-a716-446655440002", "title": "Performans sorunu", "resolution": "Sunucu optimizasyonu yapıldı"}', 'admin_panel', NOW() - INTERVAL '50 days'),
('payment_created', '{"customer_id": "550e8400-e29b-41d4-a716-446655440002", "amount": 999.99, "payment_method": "credit_card"}', 'admin_panel', NOW() - INTERVAL '45 days'),
('subscription_created', '{"customer_id": "550e8400-e29b-41d4-a716-446655440002", "plan": "Enterprise", "price": 999.99}', 'admin_panel', NOW() - INTERVAL '40 days');

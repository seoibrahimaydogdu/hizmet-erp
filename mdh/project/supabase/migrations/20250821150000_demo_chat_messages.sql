-- Demo Sohbet Mesajları Migration
-- Migration: 20250821150000_demo_chat_messages.sql

-- Önce demo müşteri ID'sini al
DO $$
DECLARE
    demo_customer_id UUID;
    demo_ticket_id UUID;
BEGIN
    -- Demo müşteri ID'sini al
    SELECT id INTO demo_customer_id FROM customers WHERE email = 'ayse.demir@example.com' LIMIT 1;
    
    -- Eğer müşteri yoksa, oluştur
    IF demo_customer_id IS NULL THEN
        INSERT INTO customers (name, email, phone, company, plan, satisfaction_score, total_tickets, currency, created_at, updated_at) 
        VALUES ('Ayşe Demir', 'ayse.demir@example.com', '+905551234567', 'Demo Company', 'premium', 4, 3, 'TRY', NOW(), NOW())
        RETURNING id INTO demo_customer_id;
    END IF;
    
    -- Demo talep oluştur (eğer yoksa)
    SELECT id INTO demo_ticket_id FROM tickets WHERE customer_id = demo_customer_id AND title LIKE '%Sisteme giriş%' LIMIT 1;
    
    IF demo_ticket_id IS NULL THEN
        INSERT INTO tickets (title, description, status, priority, category, customer_id) 
        VALUES (
            'Sisteme giriş yapamıyorum',
            'Merhaba, sisteme giriş yaparken hata alıyorum. Şifremi unuttum ve sıfırlama e-postası gelmiyor.',
            'resolved',
            'high',
            'technical',
            demo_customer_id
        )
        RETURNING id INTO demo_ticket_id;
        
        -- Tarih bilgilerini ayrı olarak güncelle
        UPDATE tickets 
        SET created_at = NOW() - INTERVAL '2 days',
            updated_at = NOW() - INTERVAL '1 day'
        WHERE id = demo_ticket_id;
    END IF;
    
    -- Demo mesajları ekle (eğer yoksa)
    IF NOT EXISTS (SELECT 1 FROM ticket_messages WHERE ticket_id = demo_ticket_id) THEN
        INSERT INTO ticket_messages (ticket_id, sender_id, sender_type, message, message_type, is_internal, is_read, created_at, updated_at) VALUES
        (demo_ticket_id, NULL, 'customer', 'Merhaba, sisteme giriş yapamıyorum. Şifremi unuttum ve sıfırlama e-postası gelmiyor. Yardım edebilir misiniz?', 'text', false, true, NOW() - INTERVAL '2 days' + INTERVAL '10 minutes', NOW() - INTERVAL '2 days' + INTERVAL '10 minutes'),
        (demo_ticket_id, NULL, 'admin', 'Merhaba Ayşe Hanım, size yardımcı olmaktan memnuniyet duyarım. Öncelikle e-posta adresinizi doğrulayalım. Hangi e-posta adresi ile kayıt oldunuz?', 'text', false, true, NOW() - INTERVAL '2 days' + INTERVAL '15 minutes', NOW() - INTERVAL '2 days' + INTERVAL '15 minutes'),
        (demo_ticket_id, NULL, 'customer', 'ayse.demir@example.com adresi ile kayıt oldum. Şifremi unuttum ve sıfırlama e-postası gelmiyor.', 'text', false, true, NOW() - INTERVAL '2 days' + INTERVAL '20 minutes', NOW() - INTERVAL '2 days' + INTERVAL '20 minutes'),
        (demo_ticket_id, NULL, 'admin', 'E-posta adresinizi kontrol ettim. Spam klasörünüzü kontrol ettiniz mi? Bazen sıfırlama e-postaları spam klasörüne düşebiliyor.', 'text', false, true, NOW() - INTERVAL '2 days' + INTERVAL '25 minutes', NOW() - INTERVAL '2 days' + INTERVAL '25 minutes'),
        (demo_ticket_id, NULL, 'customer', 'Evet, spam klasörünü de kontrol ettim ama e-posta yok. Başka bir çözüm var mı?', 'text', false, true, NOW() - INTERVAL '2 days' + INTERVAL '30 minutes', NOW() - INTERVAL '2 days' + INTERVAL '30 minutes'),
        (demo_ticket_id, NULL, 'admin', 'Tabii, size manuel olarak yeni bir şifre oluşturabilirim. Güvenlik için önce birkaç soru sormam gerekiyor. Doğum tarihiniz nedir?', 'text', false, true, NOW() - INTERVAL '2 days' + INTERVAL '35 minutes', NOW() - INTERVAL '2 days' + INTERVAL '35 minutes'),
        (demo_ticket_id, NULL, 'customer', '15 Mart 1990. Teşekkür ederim yardımınız için.', 'text', false, true, NOW() - INTERVAL '2 days' + INTERVAL '40 minutes', NOW() - INTERVAL '2 days' + INTERVAL '40 minutes'),
        (demo_ticket_id, NULL, 'admin', 'Teşekkürler. Şifrenizi sıfırladım. Yeni şifreniz: Demo123! Bu şifreyi kullanarak giriş yapabilirsiniz. Giriş yaptıktan sonra şifrenizi değiştirmenizi öneririm.', 'text', false, true, NOW() - INTERVAL '2 days' + INTERVAL '45 minutes', NOW() - INTERVAL '2 days' + INTERVAL '45 minutes'),
        (demo_ticket_id, NULL, 'customer', 'Harika! Şifre çalışıyor. Çok teşekkür ederim yardımınız için. Artık sisteme giriş yapabiliyorum.', 'text', false, true, NOW() - INTERVAL '2 days' + INTERVAL '50 minutes', NOW() - INTERVAL '2 days' + INTERVAL '50 minutes'),
        (demo_ticket_id, NULL, 'admin', 'Rica ederim! Başka bir sorunuz olursa her zaman yardımcı olmaktan memnuniyet duyarım. İyi günler!', 'text', false, true, NOW() - INTERVAL '2 days' + INTERVAL '55 minutes', NOW() - INTERVAL '2 days' + INTERVAL '55 minutes');
    END IF;
    
    -- İkinci demo talep oluştur
    INSERT INTO tickets (title, description, status, priority, category, customer_id) 
    VALUES (
        'Ödeme yapamıyorum',
        'Kredi kartımla ödeme yapmaya çalışıyorum ama hata alıyorum. Kart bilgilerim doğru ama işlem tamamlanmıyor.',
        'in_progress',
        'medium',
        'payment',
        demo_customer_id
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO demo_ticket_id;
    
    -- Tarih bilgilerini ayrı olarak güncelle
    IF demo_ticket_id IS NOT NULL THEN
        UPDATE tickets 
        SET created_at = NOW() - INTERVAL '1 day',
            updated_at = NOW() - INTERVAL '2 hours'
        WHERE id = demo_ticket_id;
    END IF;
    
    -- İkinci talebin mesajlarını ekle (eğer yoksa)
    IF demo_ticket_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ticket_messages WHERE ticket_id = demo_ticket_id) THEN
        INSERT INTO ticket_messages (ticket_id, sender_id, sender_type, message, message_type, is_internal, is_read, created_at, updated_at) VALUES
        (demo_ticket_id, NULL, 'customer', 'Merhaba, kredi kartımla ödeme yapmaya çalışıyorum ama hata alıyorum. Kart bilgilerim doğru ama işlem tamamlanmıyor. Yardım edebilir misiniz?', 'text', false, true, NOW() - INTERVAL '1 day' + INTERVAL '5 minutes', NOW() - INTERVAL '1 day' + INTERVAL '5 minutes'),
        (demo_ticket_id, NULL, 'admin', 'Merhaba Ayşe Hanım, ödeme sorununuz için size yardımcı olacağım. Hangi hata mesajını alıyorsunuz?', 'text', false, true, NOW() - INTERVAL '1 day' + INTERVAL '10 minutes', NOW() - INTERVAL '1 day' + INTERVAL '10 minutes'),
        (demo_ticket_id, NULL, 'customer', '"İşlem tamamlanamadı, lütfen tekrar deneyin" hatası alıyorum. Kartımda yeterli bakiye var.', 'text', false, true, NOW() - INTERVAL '1 day' + INTERVAL '15 minutes', NOW() - INTERVAL '1 day' + INTERVAL '15 minutes'),
        (demo_ticket_id, NULL, 'admin', 'Bu hata genellikle banka tarafından güvenlik nedeniyle işlemin reddedilmesinden kaynaklanır. Farklı bir kart deneyebilir misiniz?', 'text', false, false, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours');
    END IF;
    
    -- Üçüncü demo talep oluştur (canlı destek)
    INSERT INTO tickets (title, description, status, priority, category, customer_id) 
    VALUES (
        'Canlı destek talebi',
        'Ürün özellikleri hakkında detaylı bilgi almak istiyorum. Hangi planın bana uygun olduğunu öğrenmek istiyorum.',
        'open',
        'low',
        'support',
        demo_customer_id
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO demo_ticket_id;
    
    -- Tarih bilgilerini ayrı olarak güncelle
    IF demo_ticket_id IS NOT NULL THEN
        UPDATE tickets 
        SET created_at = NOW() - INTERVAL '30 minutes',
            updated_at = NOW() - INTERVAL '30 minutes'
        WHERE id = demo_ticket_id;
    END IF;
    
    -- Üçüncü talebin mesajlarını ekle (eğer yoksa)
    IF demo_ticket_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ticket_messages WHERE ticket_id = demo_ticket_id) THEN
        INSERT INTO ticket_messages (ticket_id, sender_id, sender_type, message, message_type, is_internal, is_read, created_at, updated_at) VALUES
        (demo_ticket_id, NULL, 'customer', 'Merhaba, ürün özellikleri hakkında detaylı bilgi almak istiyorum. Hangi planın bana uygun olduğunu öğrenmek istiyorum.', 'text', false, false, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes');
    END IF;
    
END $$;

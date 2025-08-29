-- Employee Messages Table
CREATE TABLE IF NOT EXISTS employee_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    sender_id UUID NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_role VARCHAR(255) NOT NULL,
    sender_avatar VARCHAR(10) NOT NULL,
    channel_id VARCHAR(255),
    message_type VARCHAR(50) DEFAULT 'text',
    attachments TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_pinned BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    reactions JSONB DEFAULT '{}',
    mentions TEXT[] DEFAULT '{}',
    is_direct_message BOOLEAN DEFAULT FALSE,
    recipient_id UUID
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_messages_channel_id ON employee_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_employee_messages_sender_id ON employee_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_employee_messages_created_at ON employee_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_employee_messages_recipient_id ON employee_messages(recipient_id);

-- RLS Policies - Geliştirme için devre dışı
-- ALTER TABLE employee_messages ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları sil (eğer varsa)
DROP POLICY IF EXISTS "Allow read access to employee messages" ON employee_messages;
DROP POLICY IF EXISTS "Allow insert access to employee messages" ON employee_messages;
DROP POLICY IF EXISTS "Allow update own messages" ON employee_messages;
DROP POLICY IF EXISTS "Allow delete own messages" ON employee_messages;

-- RLS'yi devre dışı bırak (geliştirme için)
ALTER TABLE employee_messages DISABLE ROW LEVEL SECURITY;

-- Not: RLS devre dışı bırakıldığında tüm kullanıcılar tüm verilere erişebilir
-- Prodüksiyon ortamında RLS'yi tekrar etkinleştirmeyi unutmayın

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employee_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at (eğer varsa sil)
DROP TRIGGER IF EXISTS update_employee_messages_updated_at ON employee_messages;
CREATE TRIGGER update_employee_messages_updated_at
    BEFORE UPDATE ON employee_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_employee_messages_updated_at();

-- Test DM verisi ekle
DO $$
DECLARE
    emp1_id UUID;
    emp2_id UUID;
BEGIN
    -- Çalışan ID'lerini al
    SELECT id INTO emp1_id FROM employees WHERE email = 'ahmet.yilmaz@company.com' LIMIT 1;
    SELECT id INTO emp2_id FROM employees WHERE email = 'ayse.demir@company.com' LIMIT 1;
    
    -- Eğer çalışanlar varsa test DM'leri ekle
    IF emp1_id IS NOT NULL AND emp2_id IS NOT NULL THEN
        INSERT INTO employee_messages (content, sender_id, sender_name, sender_role, sender_avatar, is_direct_message, recipient_id, created_at) VALUES
        ('Merhaba Ayşe, nasılsın?', emp1_id, 'Ahmet Yılmaz', 'Yazılım Geliştirici', 'AY', true, emp2_id, NOW() - INTERVAL '1 hour'),
        ('Merhaba Ahmet, iyiyim teşekkürler. Sen nasılsın?', emp2_id, 'Ayşe Demir', 'Müşteri Temsilcisi', 'AD', true, emp1_id, NOW() - INTERVAL '30 minutes'),
        ('İyiyim, proje nasıl gidiyor?', emp1_id, 'Ahmet Yılmaz', 'Yazılım Geliştirici', 'AY', true, emp2_id, NOW() - INTERVAL '15 minutes'),
        ('Çok iyi gidiyor, müşteriler memnun.', emp2_id, 'Ayşe Demir', 'Müşteri Temsilcisi', 'AD', true, emp1_id, NOW() - INTERVAL '5 minutes')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

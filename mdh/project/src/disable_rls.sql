-- Employee Messages tablosu için RLS devre dışı bırakma
ALTER TABLE employee_messages DISABLE ROW LEVEL SECURITY;

-- Employees tablosu için RLS devre dışı bırakma (eğer varsa)
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- Notifications tablosu için RLS devre dışı bırakma (eğer varsa)
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Tüm tablolar için RLS durumunu kontrol etme
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('employee_messages', 'employees', 'notifications');

-- Eğer tablo yoksa oluşturma (güvenlik için)
-- Employee Messages tablosu oluşturma (eğer yoksa)
CREATE TABLE IF NOT EXISTS employee_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    sender_avatar TEXT,
    channel_id TEXT,
    message_type TEXT DEFAULT 'text',
    attachments TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_direct_message BOOLEAN DEFAULT FALSE,
    recipient_id TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    reactions JSONB DEFAULT '{}',
    mentions TEXT[] DEFAULT '{}'
);

-- Employees tablosu oluşturma (eğer yoksa)
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    position TEXT,
    department TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications tablosu oluşturma (eğer yoksa)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Örnek veri ekleme (test için)
INSERT INTO employees (id, name, position, department) VALUES
('1', 'Ahmet Yılmaz', 'İK Müdürü', 'İnsan Kaynakları'),
('2', 'Fatma Demir', 'Muhasebe Uzmanı', 'Muhasebe'),
('3', 'Mehmet Kaya', 'Yazılım Geliştirici', 'Teknoloji'),
('4', 'Ayşe Özkan', 'Satış Temsilcisi', 'Satış')
ON CONFLICT (id) DO NOTHING;

-- Örnek mesaj ekleme (test için)
INSERT INTO employee_messages (content, sender_id, sender_name, sender_role, sender_avatar, is_direct_message, recipient_id) VALUES
('Merhaba! Nasılsınız?', '1', 'Ahmet Yılmaz', 'İK Müdürü', 'AY', TRUE, '2'),
('İyiyim, teşekkürler!', '2', 'Fatma Demir', 'Muhasebe Uzmanı', 'FD', TRUE, '1')
ON CONFLICT DO NOTHING;

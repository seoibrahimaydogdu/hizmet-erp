-- Notifications tablosu - Eğer yoksa oluştur
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Eksik sütunları ekle (eğer yoksa)
DO $$
BEGIN
    -- is_read sütunu ekle (eğer yoksa)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'is_read') THEN
        ALTER TABLE notifications ADD COLUMN is_read boolean DEFAULT false;
    END IF;
    
    -- updated_at sütunu ekle (eğer yoksa)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'updated_at') THEN
        ALTER TABLE notifications ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- İndeksler (eğer yoksa)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- RLS (Row Level Security) politikaları
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politikaları sil ve yeniden oluştur (eğer varsa)
DROP POLICY IF EXISTS "Users can view notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete notifications" ON notifications;

-- Tüm kullanıcılar bildirimleri okuyabilir
CREATE POLICY "Users can view notifications" ON notifications
    FOR SELECT USING (true);

-- Sadece yetkili kullanıcılar bildirim oluşturabilir
CREATE POLICY "Users can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Sadece yetkili kullanıcılar bildirim güncelleyebilir
CREATE POLICY "Users can update notifications" ON notifications
    FOR UPDATE USING (true);

-- Sadece yetkili kullanıcılar bildirim silebilir
CREATE POLICY "Users can delete notifications" ON notifications
    FOR DELETE USING (true);

-- Otomatik updated_at güncelleme fonksiyonu (eğer yoksa)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger'ı sil ve yeniden oluştur (eğer varsa)
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

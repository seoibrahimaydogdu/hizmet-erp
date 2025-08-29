-- Notifications tablosu schema cache sorununu çöz
-- Basit çözüm: Tabloyu yeniden oluştur

-- Mevcut tabloyu sil (eğer varsa)
DROP TABLE IF EXISTS notifications CASCADE;

-- Tabloyu yeniden oluştur
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  user_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- İndeksler
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- RLS (Row Level Security) politikaları
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politikalar
CREATE POLICY "Users can view notifications" ON notifications
    FOR SELECT USING (true);

CREATE POLICY "Users can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update notifications" ON notifications
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete notifications" ON notifications
    FOR DELETE USING (true);

-- Otomatik updated_at güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

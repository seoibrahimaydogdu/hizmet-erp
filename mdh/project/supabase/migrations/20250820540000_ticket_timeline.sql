-- Talep zaman çizelgesi tablosu
CREATE TABLE IF NOT EXISTS ticket_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  action_description TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  user_id UUID,
  user_type VARCHAR(20) NOT NULL DEFAULT 'system', -- 'customer', 'agent', 'system'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_ticket_timeline_ticket_id ON ticket_timeline(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_timeline_created_at ON ticket_timeline(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_timeline_action_type ON ticket_timeline(action_type);

-- RLS politikaları
ALTER TABLE ticket_timeline ENABLE ROW LEVEL SECURITY;

-- Müşteriler kendi taleplerinin zaman çizelgesini görebilir
DROP POLICY IF EXISTS "Customers can view their own ticket timeline" ON ticket_timeline;
CREATE POLICY "Customers can view their own ticket timeline" ON ticket_timeline
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM tickets 
      WHERE customer_id = auth.uid()
    )
  );

-- Temsilciler atandıkları taleplerin zaman çizelgesini görebilir
DROP POLICY IF EXISTS "Agents can view assigned ticket timeline" ON ticket_timeline;
CREATE POLICY "Agents can view assigned ticket timeline" ON ticket_timeline
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM tickets 
      WHERE agent_id = auth.uid()
    )
  );

-- Adminler tüm zaman çizelgesini görebilir (basit kontrol)
DROP POLICY IF EXISTS "Admins can view all ticket timeline" ON ticket_timeline;
CREATE POLICY "Admins can view all ticket timeline" ON ticket_timeline
  FOR SELECT USING (true);

-- Sistem ve temsilciler zaman çizelgesi ekleyebilir
DROP POLICY IF EXISTS "System and agents can insert timeline" ON ticket_timeline;
CREATE POLICY "System and agents can insert timeline" ON ticket_timeline
  FOR INSERT WITH CHECK (true);

-- Trigger fonksiyonu - talep durumu değiştiğinde otomatik zaman çizelgesi ekle
CREATE OR REPLACE FUNCTION log_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO ticket_timeline (
      ticket_id,
      action_type,
      action_description,
      previous_value,
      new_value,
      user_id,
      user_type,
      metadata
    ) VALUES (
      NEW.id,
      'status_change',
      'Talep durumu güncellendi',
      OLD.status,
      NEW.status,
      COALESCE(NEW.agent_id, auth.uid()),
      CASE 
        WHEN NEW.agent_id IS NOT NULL THEN 'agent'
        ELSE 'system'
      END,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'priority', NEW.priority,
        'category', NEW.category
      )
    );
  END IF;
  
  IF OLD.agent_id IS DISTINCT FROM NEW.agent_id THEN
    INSERT INTO ticket_timeline (
      ticket_id,
      action_type,
      action_description,
      previous_value,
      new_value,
      user_id,
      user_type,
      metadata
    ) VALUES (
      NEW.id,
      'assignment_change',
      CASE 
        WHEN NEW.agent_id IS NULL THEN 'Temsilci ataması kaldırıldı'
        ELSE 'Temsilci atandı'
      END,
      OLD.agent_id,
      NEW.agent_id,
      auth.uid(),
      'system',
      jsonb_build_object(
        'old_agent_id', OLD.agent_id,
        'new_agent_id', NEW.agent_id
      )
    );
  END IF;
  
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO ticket_timeline (
      ticket_id,
      action_type,
      action_description,
      previous_value,
      new_value,
      user_id,
      user_type,
      metadata
    ) VALUES (
      NEW.id,
      'priority_change',
      'Talep önceliği güncellendi',
      OLD.priority,
      NEW.priority,
      COALESCE(NEW.agent_id, auth.uid()),
      CASE 
        WHEN NEW.agent_id IS NOT NULL THEN 'agent'
        ELSE 'system'
      END,
      jsonb_build_object(
        'old_priority', OLD.priority,
        'new_priority', NEW.priority
      )
    );
  END IF;
  
  IF OLD.category IS DISTINCT FROM NEW.category THEN
    INSERT INTO ticket_timeline (
      ticket_id,
      action_type,
      action_description,
      previous_value,
      new_value,
      user_id,
      user_type,
      metadata
    ) VALUES (
      NEW.id,
      'category_change',
      'Talep kategorisi güncellendi',
      OLD.category,
      NEW.category,
      COALESCE(NEW.agent_id, auth.uid()),
      CASE 
        WHEN NEW.agent_id IS NOT NULL THEN 'agent'
        ELSE 'system'
      END,
      jsonb_build_object(
        'old_category', OLD.category,
        'new_category', NEW.category
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı tickets tablosuna ekle
DROP TRIGGER IF EXISTS ticket_timeline_trigger ON tickets;
CREATE TRIGGER ticket_timeline_trigger
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION log_ticket_status_change();

-- Talep oluşturulduğunda ilk kayıt ekle
CREATE OR REPLACE FUNCTION log_ticket_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ticket_timeline (
    ticket_id,
    action_type,
    action_description,
    new_value,
    user_id,
    user_type,
    metadata
  ) VALUES (
    NEW.id,
    'ticket_created',
    'Talep İsteği Oluşturuldu',
    NEW.status,
    NEW.customer_id,
    'customer',
    jsonb_build_object(
      'title', NEW.title,
      'category', NEW.category,
      'priority', NEW.priority,
      'description', NEW.description
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Talep oluşturma trigger'ı
DROP TRIGGER IF EXISTS ticket_creation_trigger ON tickets;
CREATE TRIGGER ticket_creation_trigger
  AFTER INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION log_ticket_creation();

-- Örnek veriler ekle (mevcut talepler için)
INSERT INTO ticket_timeline (ticket_id, action_type, action_description, new_value, user_id, user_type, metadata)
SELECT 
  id,
  'ticket_created',
  'Talep İsteği Oluşturuldu',
  status,
  customer_id,
  'customer',
  jsonb_build_object(
    'title', COALESCE(title, 'Başlıksız Talep'),
    'category', category,
    'priority', priority,
    'description', COALESCE(description, '')
  )
FROM tickets 
WHERE id NOT IN (SELECT DISTINCT ticket_id FROM ticket_timeline);

-- Mesaj iletildiğinde zaman çizelgesi ekle
CREATE OR REPLACE FUNCTION log_ticket_message()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ticket_timeline (
    ticket_id,
    action_type,
    action_description,
    user_id,
    user_type,
    metadata
  ) VALUES (
    NEW.ticket_id,
    'message_sent',
    CASE 
      WHEN NEW.sender_type = 'customer' THEN 'Müşteri mesaj gönderdi'
      WHEN NEW.sender_type = 'admin' THEN 'Temsilci yanıt verdi'
      WHEN NEW.sender_type = 'agent' THEN 'Temsilci yanıt verdi'
      ELSE 'Mesaj İletildi'
    END,
    NEW.sender_id,
    NEW.sender_type,
    jsonb_build_object(
      'message_id', NEW.id,
      'message_preview', LEFT(NEW.content, 100),
      'has_attachments', COALESCE(NEW.attachments, '[]'::jsonb) != '[]'::jsonb
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mesaj trigger'ı
DROP TRIGGER IF EXISTS ticket_message_trigger ON ticket_messages;
CREATE TRIGGER ticket_message_trigger
  AFTER INSERT ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION log_ticket_message();

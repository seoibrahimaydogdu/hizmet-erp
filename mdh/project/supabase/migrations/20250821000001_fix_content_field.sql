-- Content alanı hatasını düzelt - message alanını kullan
-- Önce eski trigger'ı kaldır
DROP TRIGGER IF EXISTS ticket_message_trigger ON ticket_messages;

-- Mesaj iletildiğinde zaman çizelgesi ekle (düzeltilmiş versiyon)
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
    CASE 
      WHEN NEW.sender_type = 'admin' THEN 'admin'
      WHEN NEW.sender_type = 'agent' THEN 'agent'
      ELSE NEW.sender_type
    END,
    jsonb_build_object(
      'message_id', NEW.id,
      'message_preview', LEFT(NEW.message, 100),
      'has_attachments', COALESCE(array_length(NEW.attachments, 1), 0) > 0
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Yeni trigger'ı oluştur
CREATE TRIGGER ticket_message_trigger
  AFTER INSERT ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION log_ticket_message();

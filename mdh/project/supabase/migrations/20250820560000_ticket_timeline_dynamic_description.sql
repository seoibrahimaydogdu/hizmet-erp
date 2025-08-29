-- Talep oluşturma tetikleyicisinde dinamik açıklama
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
    COALESCE(NULLIF(TRIM(NEW.title), ''), 'Talep') || ' oluşturuldu',
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

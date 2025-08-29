-- Tickets tablosuna ticket_type alanı ekleme
-- Bu alan hatırlatmaları normal taleplerden ayırmak için kullanılacak

ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS ticket_type text DEFAULT 'regular' CHECK (ticket_type IN ('regular', 'reminder', 'notification'));

-- Mevcut billing kategorisindeki talepleri reminder olarak işaretle
UPDATE tickets 
SET ticket_type = 'reminder' 
WHERE category = 'billing' AND ticket_type = 'regular';

-- İndeks ekle
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_type ON tickets(ticket_type);
CREATE INDEX IF NOT EXISTS idx_tickets_category_type ON tickets(category, ticket_type);

-- Ticket messages tablosuna attachments alanı ekle
ALTER TABLE ticket_messages 
ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}';

-- Mevcut mesajlar için boş attachments array'i ekle
UPDATE ticket_messages 
SET attachments = '{}' 
WHERE attachments IS NULL;

-- Attachments alanını NOT NULL yap
ALTER TABLE ticket_messages 
ALTER COLUMN attachments SET NOT NULL;

-- Attachments alanı için indeks ekle
CREATE INDEX IF NOT EXISTS idx_ticket_messages_attachments 
ON ticket_messages USING GIN (attachments);

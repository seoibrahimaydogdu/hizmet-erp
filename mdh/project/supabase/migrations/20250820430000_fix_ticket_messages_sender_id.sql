-- Ticket messages tablosundaki sender_id foreign key constraint'ini düzelt
-- sender_id alanını nullable yap
ALTER TABLE ticket_messages ALTER COLUMN sender_id DROP NOT NULL;

-- Mevcut foreign key constraint'i kaldır
ALTER TABLE ticket_messages DROP CONSTRAINT IF EXISTS ticket_messages_sender_id_fkey;

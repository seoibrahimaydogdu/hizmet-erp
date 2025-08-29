-- Talep mesajları tablosu
CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'admin')),
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'url')),
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    is_internal BOOLEAN DEFAULT FALSE, -- Sadece admin tarafından görülebilir
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender_id ON ticket_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON ticket_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_is_internal ON ticket_messages(is_internal);

-- RLS (Row Level Security) politikaları
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Müşteriler sadece kendi taleplerinin mesajlarını görebilir (internal olmayan)
CREATE POLICY "Customers can view their ticket messages" ON ticket_messages
    FOR SELECT USING (
        ticket_id IN (
            SELECT id FROM tickets 
            WHERE customer_id IN (
                SELECT id FROM customers 
                WHERE email = (
                    SELECT email FROM auth.users 
                    WHERE id = auth.uid()
                )
            )
        ) AND is_internal = FALSE
    );

-- Adminler tüm mesajları görebilir (email ile admin kontrolü)
CREATE POLICY "Admins can view all ticket messages" ON ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM agents 
            WHERE email = (
                SELECT email FROM auth.users 
                WHERE id = auth.uid()
            ) AND role = 'admin'
        )
    );

-- Müşteriler kendi taleplerine mesaj ekleyebilir
CREATE POLICY "Customers can create messages for their tickets" ON ticket_messages
    FOR INSERT WITH CHECK (
        ticket_id IN (
            SELECT id FROM tickets 
            WHERE customer_id IN (
                SELECT id FROM customers 
                WHERE email = (
                    SELECT email FROM auth.users 
                    WHERE id = auth.uid()
                )
            )
        ) AND sender_id = auth.uid() AND sender_type = 'customer'
    );

-- Adminler tüm taleplere mesaj ekleyebilir
CREATE POLICY "Admins can create messages for any ticket" ON ticket_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM agents 
            WHERE email = (
                SELECT email FROM auth.users 
                WHERE id = auth.uid()
            ) AND role = 'admin'
        ) AND sender_id = auth.uid() AND sender_type = 'admin'
    );

-- Sadece mesaj sahibi güncelleyebilir
CREATE POLICY "Users can update their own messages" ON ticket_messages
    FOR UPDATE USING (sender_id = auth.uid());

-- Sadece adminler silebilir
CREATE POLICY "Admins can delete messages" ON ticket_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM agents 
            WHERE email = (
                SELECT email FROM auth.users 
                WHERE id = auth.uid()
            ) AND role = 'admin'
        )
    );

-- Otomatik updated_at güncelleme
CREATE TRIGGER update_ticket_messages_updated_at 
    BEFORE UPDATE ON ticket_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Mesaj okunduğunda otomatik güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION mark_message_as_read()
RETURNS TRIGGER AS $$
BEGIN
    NEW.is_read = TRUE;
    NEW.read_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Mesaj okunduğunda tetikleyici
CREATE TRIGGER mark_ticket_message_read 
    BEFORE UPDATE ON ticket_messages 
    FOR EACH ROW 
    WHEN (OLD.is_read = FALSE AND NEW.is_read = TRUE)
    EXECUTE FUNCTION mark_message_as_read();

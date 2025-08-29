-- Ticket messages RLS politikalarını düzelt
-- Önce mevcut politikaları kaldır
DROP POLICY IF EXISTS "Customers can view their ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Admins can view all ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Customers can create messages for their tickets" ON ticket_messages;
DROP POLICY IF EXISTS "Admins can create messages for any ticket" ON ticket_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON ticket_messages;
DROP POLICY IF EXISTS "Admins can delete messages" ON ticket_messages;

-- Basit RLS politikaları ekle
-- Tüm kullanıcılar mesajları görebilir
CREATE POLICY "Enable read access for all users" ON ticket_messages
    FOR SELECT TO public USING (true);

-- Tüm kullanıcılar mesaj ekleyebilir
CREATE POLICY "Enable insert for all users" ON ticket_messages
    FOR INSERT TO public WITH CHECK (true);

-- Sadece mesaj sahibi güncelleyebilir
CREATE POLICY "Enable update for message owner" ON ticket_messages
    FOR UPDATE TO public USING (sender_id = auth.uid());

-- Sadece adminler silebilir
CREATE POLICY "Enable delete for admins" ON ticket_messages
    FOR DELETE TO public USING (
        EXISTS (
            SELECT 1 FROM agents 
            WHERE email = (
                SELECT email FROM auth.users 
                WHERE id = auth.uid()
            ) AND role = 'admin'
        )
    );

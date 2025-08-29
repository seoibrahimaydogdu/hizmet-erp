-- Payments tablosu için RLS politikalarını düzelt
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Notifications tablosu için RLS politikalarını düzelt
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Ticket messages tablosu için RLS politikalarını düzelt
ALTER TABLE ticket_messages DISABLE ROW LEVEL SECURITY;

-- Basit politikalar ekle
CREATE POLICY IF NOT EXISTS "Enable all access for payments" ON payments
    FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all access for notifications" ON notifications
    FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all access for ticket_messages" ON ticket_messages
    FOR ALL TO public USING (true) WITH CHECK (true);

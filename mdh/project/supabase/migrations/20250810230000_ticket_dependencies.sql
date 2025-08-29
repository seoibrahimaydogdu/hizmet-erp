-- Talep bağımlılıkları tablosu
CREATE TABLE IF NOT EXISTS ticket_dependencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    target_ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('blocks', 'depends_on', 'duplicate', 'related')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Aynı iki talep arasında aynı türde birden fazla bağımlılık olamaz
    UNIQUE(source_ticket_id, target_ticket_id, type)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_ticket_dependencies_source ON ticket_dependencies(source_ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_dependencies_target ON ticket_dependencies(target_ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_dependencies_type ON ticket_dependencies(type);

-- RLS (Row Level Security) politikaları
ALTER TABLE ticket_dependencies ENABLE ROW LEVEL SECURITY;

-- Tüm kullanıcılar bağımlılıkları okuyabilir
CREATE POLICY "Users can view ticket dependencies" ON ticket_dependencies
    FOR SELECT USING (true);

-- Sadece yetkili kullanıcılar bağımlılık oluşturabilir
CREATE POLICY "Users can create ticket dependencies" ON ticket_dependencies
    FOR INSERT WITH CHECK (true);

-- Sadece yetkili kullanıcılar bağımlılık güncelleyebilir
CREATE POLICY "Users can update ticket dependencies" ON ticket_dependencies
    FOR UPDATE USING (true);

-- Sadece yetkili kullanıcılar bağımlılık silebilir
CREATE POLICY "Users can delete ticket dependencies" ON ticket_dependencies
    FOR DELETE USING (true);

-- Otomatik updated_at güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ticket_dependencies_updated_at 
    BEFORE UPDATE ON ticket_dependencies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

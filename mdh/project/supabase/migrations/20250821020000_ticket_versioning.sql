-- Talep Versiyonlama Sistemi
-- Bu migration talep değişiklik geçmişi, geri alma ve versiyon karşılaştırma özelliklerini ekler

-- Talep versiyonları tablosu
CREATE TABLE IF NOT EXISTS ticket_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title TEXT,
    description TEXT,
    status TEXT,
    priority TEXT,
    category TEXT,
    agent_id UUID,
    tags TEXT[],
    custom_fields JSONB,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    change_reason TEXT,
    change_type TEXT NOT NULL CHECK (change_type IN ('manual', 'auto', 'revert')),
    previous_version_id UUID REFERENCES ticket_versions(id),
    
    -- Versiyon numarası ve talep ID'si benzersiz olmalı
    UNIQUE(ticket_id, version_number)
);

-- Versiyon değişiklik detayları tablosu
CREATE TABLE IF NOT EXISTS ticket_version_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version_id UUID NOT NULL REFERENCES ticket_versions(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    change_type TEXT NOT NULL CHECK (change_type IN ('added', 'modified', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Versiyon geri alma geçmişi tablosu
CREATE TABLE IF NOT EXISTS ticket_version_reverts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    from_version_id UUID NOT NULL REFERENCES ticket_versions(id),
    to_version_id UUID NOT NULL REFERENCES ticket_versions(id),
    reverted_by UUID,
    revert_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reverted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    admin_notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'investigation_required'))
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_ticket_versions_ticket_id ON ticket_versions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_versions_created_at ON ticket_versions(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_version_changes_version_id ON ticket_version_changes(version_id);
CREATE INDEX IF NOT EXISTS idx_ticket_version_reverts_ticket_id ON ticket_version_reverts(ticket_id);

-- RLS politikaları - Geçici olarak devre dışı
-- ALTER TABLE ticket_versions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ticket_version_changes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ticket_version_reverts ENABLE ROW LEVEL SECURITY;

-- RLS politikaları geçici olarak devre dışı - Tüm kullanıcılar erişebilir
-- Versiyonları görüntüleme politikası
-- CREATE POLICY "Users can view ticket versions for their tickets" ON ticket_versions
--     FOR SELECT USING (
--         ticket_id IN (
--             SELECT id FROM tickets 
--             WHERE customer_id = auth.uid() OR agent_id = auth.uid()
--         )
--     );

-- Versiyon değişikliklerini görüntüleme politikası
-- CREATE POLICY "Users can view version changes for their tickets" ON ticket_version_changes
--     FOR SELECT USING (
--         version_id IN (
--             SELECT id FROM ticket_versions 
--             WHERE ticket_id IN (
--                 SELECT id FROM tickets 
--                 WHERE customer_id = auth.uid() OR agent_id = auth.uid()
--             )
--         )
--     );

-- Geri alma geçmişini görüntüleme politikası
-- CREATE POLICY "Users can view revert history for their tickets" ON ticket_version_reverts
--     FOR SELECT USING (
--         ticket_id IN (
--             SELECT id FROM tickets 
--             WHERE customer_id = auth.uid() OR agent_id = auth.uid()
--         )
--     );

-- Versiyon oluşturma politikası (sadece atanmış temsilciler ve müşteri)
-- CREATE POLICY "Users can create versions for their tickets" ON ticket_versions
--     FOR INSERT WITH CHECK (
--         ticket_id IN (
--             SELECT id FROM tickets 
--             WHERE customer_id = auth.uid() OR agent_id = auth.uid()
--         )
--     );

-- Değişiklik kaydetme politikası
-- CREATE POLICY "Users can create version changes for their tickets" ON ticket_version_changes
--     FOR INSERT WITH CHECK (
--         version_id IN (
--             SELECT id FROM ticket_versions 
--             WHERE ticket_id IN (
--                 SELECT id FROM tickets 
--                 WHERE customer_id = auth.uid() OR agent_id = auth.uid()
--         )
--     );

-- Geri alma kaydetme politikası
-- CREATE POLICY "Users can create revert records for their tickets" ON ticket_version_reverts
--     FOR INSERT WITH CHECK (
--         ticket_id IN (
--             SELECT id FROM tickets 
--             WHERE customer_id = auth.uid() OR agent_id = auth.uid()
--         )
--     );

-- Otomatik versiyon oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_ticket_version(
    p_ticket_id UUID,
    p_change_reason TEXT DEFAULT NULL,
    p_change_type TEXT DEFAULT 'manual'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_version_number INTEGER;
    v_version_id UUID;
    v_ticket RECORD;
BEGIN
    -- Mevcut en yüksek versiyon numarasını bul
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
    FROM ticket_versions
    WHERE ticket_id = p_ticket_id;
    
    -- Talep bilgilerini al
    SELECT * INTO v_ticket
    FROM tickets
    WHERE id = p_ticket_id;
    
    -- Yeni versiyon oluştur
    INSERT INTO ticket_versions (
        ticket_id,
        version_number,
        title,
        description,
        status,
        priority,
        category,
        agent_id,
        tags,
        custom_fields,
        created_by,
        change_reason,
        change_type
    ) VALUES (
        p_ticket_id,
        v_version_number,
        v_ticket.title,
        v_ticket.description,
        v_ticket.status,
        v_ticket.priority,
        v_ticket.category,
        v_ticket.agent_id,
        v_ticket.tags,
        v_ticket.custom_fields,
        COALESCE(auth.uid(), NULL),
        p_change_reason,
        p_change_type
    ) RETURNING id INTO v_version_id;
    
    RETURN v_version_id;
END;
$$;

-- Değişiklikleri karşılaştırma fonksiyonu
CREATE OR REPLACE FUNCTION compare_ticket_versions(
    p_version1_id UUID,
    p_version2_id UUID
)
RETURNS TABLE (
    field_name TEXT,
    version1_value TEXT,
    version2_value TEXT,
    change_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'title' as field_name,
        v1.title as version1_value,
        v2.title as version2_value,
        CASE 
            WHEN v1.title IS DISTINCT FROM v2.title THEN 'modified'
            ELSE 'unchanged'
        END as change_type
    FROM ticket_versions v1, ticket_versions v2
    WHERE v1.id = p_version1_id AND v2.id = p_version2_id
    
    UNION ALL
    
    SELECT 
        'description' as field_name,
        v1.description as version1_value,
        v2.description as version2_value,
        CASE 
            WHEN v1.description IS DISTINCT FROM v2.description THEN 'modified'
            ELSE 'unchanged'
        END as change_type
    FROM ticket_versions v1, ticket_versions v2
    WHERE v1.id = p_version1_id AND v2.id = p_version2_id
    
    UNION ALL
    
    SELECT 
        'status' as field_name,
        v1.status as version1_value,
        v2.status as version2_value,
        CASE 
            WHEN v1.status IS DISTINCT FROM v2.status THEN 'modified'
            ELSE 'unchanged'
        END as change_type
    FROM ticket_versions v1, ticket_versions v2
    WHERE v1.id = p_version1_id AND v2.id = p_version2_id
    
    UNION ALL
    
    SELECT 
        'priority' as field_name,
        v1.priority as version1_value,
        v2.priority as version2_value,
        CASE 
            WHEN v1.priority IS DISTINCT FROM v2.priority THEN 'modified'
            ELSE 'unchanged'
        END as change_type
    FROM ticket_versions v1, ticket_versions v2
    WHERE v1.id = p_version1_id AND v2.id = p_version2_id
    
    UNION ALL
    
    SELECT 
        'category' as field_name,
        v1.category as version1_value,
        v2.category as version2_value,
        CASE 
            WHEN v1.category IS DISTINCT FROM v2.category THEN 'modified'
            ELSE 'unchanged'
        END as change_type
    FROM ticket_versions v1, ticket_versions v2
    WHERE v1.id = p_version1_id AND v2.id = p_version2_id;
END;
$$;

-- Talep güncelleme trigger fonksiyonu (otomatik versiyon oluşturma)
CREATE OR REPLACE FUNCTION trigger_ticket_version_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Önemli alanlarda değişiklik varsa versiyon oluştur
    IF (OLD.title IS DISTINCT FROM NEW.title OR
        OLD.description IS DISTINCT FROM NEW.description OR
        OLD.status IS DISTINCT FROM NEW.status OR
        OLD.priority IS DISTINCT FROM NEW.priority OR
        OLD.category IS DISTINCT FROM NEW.category OR
        OLD.agent_id IS DISTINCT FROM NEW.agent_id) THEN
        
        PERFORM create_ticket_version(
            NEW.id,
            'Otomatik versiyon oluşturuldu',
            'auto'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Tickets tablosuna geri alma alanları ekle
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS last_reverted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS last_reverted_by UUID;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS last_reverted_to_version INTEGER;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS revert_count INTEGER DEFAULT 0;

-- Trigger oluştur
DROP TRIGGER IF EXISTS ticket_version_trigger ON tickets;
CREATE TRIGGER ticket_version_trigger
    AFTER UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION trigger_ticket_version_creation();

-- Örnek veri ekleme
INSERT INTO ticket_versions (ticket_id, version_number, title, description, status, priority, category, created_by, change_reason, change_type)
SELECT 
    t.id,
    1,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.category,
    t.customer_id,
    'İlk versiyon',
    'manual'
FROM tickets t
WHERE NOT EXISTS (
    SELECT 1 FROM ticket_versions tv WHERE tv.ticket_id = t.id
);

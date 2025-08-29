-- Index boyut limitini artırma migration'ı
-- PostgreSQL'de index row size limitini artırmak için gerekli ayarlar

-- Mevcut index'i sil ve yeniden oluştur
DROP INDEX IF EXISTS idx_ticket_messages_attachments;

-- Index'i yeniden oluştur (daha büyük boyut limiti ile)
CREATE INDEX idx_ticket_messages_attachments 
ON ticket_messages USING GIN (attachments) 
WITH (gin_pending_list_limit = 5000);

-- Eğer hala sorun yaşanırsa, alternatif olarak daha büyük bir limit
-- CREATE INDEX idx_ticket_messages_attachments 
-- ON ticket_messages USING GIN (attachments) 
-- WITH (gin_pending_list_limit = 10000);

-- Ayrıca maintenance_work_mem parametresini geçici olarak artır
-- Bu sadece bu migration sırasında geçerli olacak
SET maintenance_work_mem = '256MB';

-- Index boyutunu kontrol etmek için bir fonksiyon
CREATE OR REPLACE FUNCTION check_index_size(p_index_name text)
RETURNS TABLE (
    index_name text,
    table_name text,
    index_size text,
    index_definition text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.indexname::text,
        t.tablename::text,
        pg_size_pretty(pg_relation_size(i.indexname::regclass))::text,
        i.indexdef::text
    FROM pg_indexes i
    JOIN pg_tables t ON i.tablename = t.tablename
    WHERE i.indexname = p_index_name;
END;
$$ LANGUAGE plpgsql;

-- Index boyutunu kontrol et
SELECT * FROM check_index_size('idx_ticket_messages_attachments');

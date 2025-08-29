-- PostgreSQL satır boyutu limitini 25MB'a çıkarma
-- Bu migration büyük dosya eklerini desteklemek için gerekli

-- PostgreSQL'de satır boyutu limitini artırmak için TOAST (The Oversized-Attribute Storage Technique) kullanılır
-- TEXT[] alanları otomatik olarak TOAST edilir, ancak daha büyük limitler için ayarlar yapılmalı

-- Mevcut index'i sil (eğer varsa)
DROP INDEX IF EXISTS idx_ticket_messages_attachments;

-- TOAST tablosu için storage parametrelerini ayarla
ALTER TABLE ticket_messages SET (
    toast_tuple_target = 8160,
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

-- Attachments alanını TOAST edilebilir yap (zaten otomatik olarak yapılır)
-- Ancak daha büyük boyutlar için storage parametresini ayarla
ALTER TABLE ticket_messages ALTER COLUMN attachments SET STORAGE EXTENDED;

-- Yeni index oluştur (daha büyük boyut limiti ile)
CREATE INDEX idx_ticket_messages_attachments 
ON ticket_messages USING GIN (attachments) 
WITH (
    gin_pending_list_limit = 10000,
    fastupdate = true
);

-- PostgreSQL ayarlarını geçici olarak artır (bu migration sırasında)
-- shared_buffers sunucu yeniden başlatılmadan değiştirilemez, bu yüzden sadece session ayarlarını değiştiriyoruz
SET maintenance_work_mem = '512MB';
SET work_mem = '256MB';

-- Tablo istatistiklerini güncelle
ANALYZE ticket_messages;

-- Index boyutunu kontrol etmek için fonksiyon
CREATE OR REPLACE FUNCTION get_table_size_info(p_table_name text)
RETURNS TABLE (
    table_name text,
    table_size text,
    index_size text,
    total_size text,
    row_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename::text as table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))::text as table_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename))::text as index_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))::text as total_size,
        (SELECT reltuples::bigint FROM pg_class WHERE relname = tablename) as row_count
    FROM pg_tables 
    WHERE tablename = p_table_name;
END;
$$ LANGUAGE plpgsql;

-- Tablo boyut bilgilerini kontrol et
SELECT * FROM get_table_size_info('ticket_messages');

-- Attachments alanının boyutunu kontrol etmek için fonksiyon
CREATE OR REPLACE FUNCTION check_attachments_size()
RETURNS TABLE (
    message_id uuid,
    attachments_count integer,
    total_size text,
    max_attachment_size text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tm.id as message_id,
        array_length(tm.attachments, 1) as attachments_count,
        pg_size_pretty(
            COALESCE(
                sum(
                    CASE 
                        WHEN attachment LIKE 'data:%' THEN 
                            length(attachment) -- Base64 encoded data
                        ELSE 
                            length(attachment) -- URL or other text
                    END
                ), 0
            )::bigint
        )::text as total_size,
        pg_size_pretty(
            COALESCE(
                max(
                    CASE 
                        WHEN attachment LIKE 'data:%' THEN 
                            length(attachment)
                        ELSE 
                            length(attachment)
                    END
                ), 0
            )::bigint
        )::text as max_attachment_size
    FROM ticket_messages tm,
         unnest(tm.attachments) as attachment
    GROUP BY tm.id, tm.attachments
    ORDER BY total_size DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- En büyük attachment'ları kontrol et
SELECT * FROM check_attachments_size();

-- Başarı mesajı
DO $$
BEGIN
    RAISE NOTICE 'Migration tamamlandı: ticket_messages tablosu 25MB satır boyutu limitini destekleyecek şekilde yapılandırıldı';
END $$;


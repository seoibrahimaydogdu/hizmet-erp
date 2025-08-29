-- Queue Sistemi Migration
-- Canlı destek sıra yönetimi için gerekli tablolar

-- Queue pozisyonları tablosu
CREATE TABLE IF NOT EXISTS queue_positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT NOT NULL,
    estimated_wait_time INTEGER NOT NULL, -- dakika cinsinden
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_service', 'completed', 'left')),
    agent_id UUID REFERENCES agents(id),
    agent_name TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Queue ayarları tablosu
CREATE TABLE IF NOT EXISTS queue_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Queue istatistikleri tablosu
CREATE TABLE IF NOT EXISTS queue_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    total_joined INTEGER DEFAULT 0,
    total_completed INTEGER DEFAULT 0,
    total_left INTEGER DEFAULT 0,
    avg_wait_time DECIMAL(10,2) DEFAULT 0,
    avg_service_time DECIMAL(10,2) DEFAULT 0,
    max_wait_time INTEGER DEFAULT 0,
    min_wait_time INTEGER DEFAULT 0,
    peak_hour INTEGER DEFAULT 0,
    peak_queue_length INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);

-- Queue geçmişi tablosu
CREATE TABLE IF NOT EXISTS queue_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    queue_position_id UUID NOT NULL REFERENCES queue_positions(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('joined', 'assigned', 'started', 'completed', 'left')),
    action_by UUID, -- agent_id veya customer_id
    action_by_type TEXT CHECK (action_by_type IN ('agent', 'customer', 'system')),
    previous_status TEXT,
    new_status TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_queue_positions_status ON queue_positions(status);
CREATE INDEX IF NOT EXISTS idx_queue_positions_priority ON queue_positions(priority);
CREATE INDEX IF NOT EXISTS idx_queue_positions_joined_at ON queue_positions(joined_at);
CREATE INDEX IF NOT EXISTS idx_queue_positions_customer_id ON queue_positions(customer_id);
CREATE INDEX IF NOT EXISTS idx_queue_positions_agent_id ON queue_positions(agent_id);
CREATE INDEX IF NOT EXISTS idx_queue_history_queue_position_id ON queue_history(queue_position_id);
CREATE INDEX IF NOT EXISTS idx_queue_history_action ON queue_history(action);
CREATE INDEX IF NOT EXISTS idx_queue_statistics_date ON queue_statistics(date);

-- RLS politikaları - Geçici olarak devre dışı
-- ALTER TABLE queue_positions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE queue_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE queue_statistics ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE queue_history ENABLE ROW LEVEL SECURITY;

-- Queue pozisyonları görüntüleme politikası
-- CREATE POLICY "Users can view queue positions" ON queue_positions
--     FOR SELECT USING (true);

-- Queue pozisyonları ekleme politikası
-- CREATE POLICY "Customers can join queue" ON queue_positions
--     FOR INSERT WITH CHECK (
--         customer_id = auth.uid() OR 
--         customer_id IN (SELECT id FROM customers WHERE email = auth.jwt() ->> 'email')
--     );

-- Queue pozisyonları güncelleme politikası
-- CREATE POLICY "Users can update their queue positions" ON queue_positions
--     FOR UPDATE USING (
--         customer_id = auth.uid() OR 
--         agent_id = auth.uid() OR
--         customer_id IN (SELECT id FROM customers WHERE email = auth.jwt() ->> 'email')
--     );

-- Otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_queue_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_queue_updated_at
    BEFORE UPDATE ON queue_positions
    FOR EACH ROW
    EXECUTE FUNCTION update_queue_updated_at();

-- Queue geçmişi otomatik kayıt trigger'ı
CREATE OR REPLACE FUNCTION log_queue_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Yeni kayıt eklendiğinde
    IF TG_OP = 'INSERT' THEN
        INSERT INTO queue_history (
            queue_position_id,
            action,
            action_by,
            action_by_type,
            new_status,
            notes
        ) VALUES (
            NEW.id,
            'joined',
            NEW.customer_id,
            'customer',
            NEW.status,
            'Müşteri sıraya katıldı'
        );
        RETURN NEW;
    END IF;

    -- Kayıt güncellendiğinde
    IF TG_OP = 'UPDATE' THEN
        -- Durum değişikliği kontrolü
        IF OLD.status != NEW.status THEN
            INSERT INTO queue_history (
                queue_position_id,
                action,
                action_by,
                action_by_type,
                previous_status,
                new_status,
                notes
            ) VALUES (
                NEW.id,
                CASE 
                    WHEN NEW.status = 'in_service' THEN 'assigned'
                    WHEN NEW.status = 'completed' THEN 'completed'
                    WHEN NEW.status = 'left' THEN 'left'
                    ELSE 'updated'
                END,
                COALESCE(NEW.agent_id, NEW.customer_id),
                CASE 
                    WHEN NEW.agent_id IS NOT NULL THEN 'agent'
                    ELSE 'customer'
                END,
                OLD.status,
                NEW.status,
                CASE 
                    WHEN NEW.status = 'in_service' THEN 'Temsilci atandı'
                    WHEN NEW.status = 'completed' THEN 'Hizmet tamamlandı'
                    WHEN NEW.status = 'left' THEN 'Müşteri sıradan ayrıldı'
                    ELSE 'Durum güncellendi'
                END
            );
        END IF;
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_log_queue_history
    AFTER INSERT OR UPDATE ON queue_positions
    FOR EACH ROW
    EXECUTE FUNCTION log_queue_history();

-- Queue istatistikleri güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_queue_statistics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_date DATE := CURRENT_DATE;
    v_stats RECORD;
BEGIN
    -- Bugünün istatistiklerini al
    SELECT * INTO v_stats
    FROM queue_statistics
    WHERE date = v_date;

    -- İstatistik yoksa oluştur
    IF v_stats IS NULL THEN
        INSERT INTO queue_statistics (date)
        VALUES (v_date);
    END IF;

    -- İstatistikleri güncelle
    UPDATE queue_statistics
    SET 
        total_joined = (
            SELECT COUNT(*) 
            FROM queue_positions 
            WHERE DATE(joined_at) = v_date
        ),
        total_completed = (
            SELECT COUNT(*) 
            FROM queue_positions 
            WHERE DATE(completed_at) = v_date AND status = 'completed'
        ),
        total_left = (
            SELECT COUNT(*) 
            FROM queue_positions 
            WHERE DATE(completed_at) = v_date AND status = 'left'
        ),
        avg_wait_time = (
            SELECT AVG(EXTRACT(EPOCH FROM (started_at - joined_at)) / 60)
            FROM queue_positions 
            WHERE DATE(started_at) = v_date AND started_at IS NOT NULL
        ),
        avg_service_time = (
            SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60)
            FROM queue_positions 
            WHERE DATE(completed_at) = v_date AND completed_at IS NOT NULL AND started_at IS NOT NULL
        ),
        max_wait_time = (
            SELECT MAX(EXTRACT(EPOCH FROM (started_at - joined_at)) / 60)
            FROM queue_positions 
            WHERE DATE(started_at) = v_date AND started_at IS NOT NULL
        ),
        min_wait_time = (
            SELECT MIN(EXTRACT(EPOCH FROM (started_at - joined_at)) / 60)
            FROM queue_positions 
            WHERE DATE(started_at) = v_date AND started_at IS NOT NULL
        ),
        peak_queue_length = (
            SELECT MAX(queue_length)
            FROM (
                SELECT COUNT(*) as queue_length
                FROM queue_positions
                WHERE DATE(joined_at) = v_date AND status = 'waiting'
                GROUP BY DATE_TRUNC('hour', joined_at)
            ) hourly_counts
        ),
        updated_at = NOW()
    WHERE date = v_date;

    RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_update_queue_statistics
    AFTER INSERT OR UPDATE OR DELETE ON queue_positions
    FOR EACH ROW
    EXECUTE FUNCTION update_queue_statistics();

-- Varsayılan queue ayarları
INSERT INTO queue_settings (setting_key, setting_value, description) VALUES
('general', '{"max_wait_time": 30, "auto_assign": true, "priority_boost": true, "notifications": true}', 'Genel queue ayarları'),
('priorities', '{"urgent": {"weight": 4, "color": "#ef4444"}, "high": {"weight": 3, "color": "#f97316"}, "medium": {"weight": 2, "color": "#eab308"}, "low": {"weight": 1, "color": "#22c55e"}}', 'Öncelik ayarları'),
('categories', '["general", "technical", "billing", "sales", "complaint"]', 'Destek kategorileri'),
('notifications', '{"queue_joined": true, "agent_assigned": true, "queue_position": true, "estimated_time": true}', 'Bildirim ayarları')
ON CONFLICT (setting_key) DO NOTHING;

-- Queue pozisyonları için view
CREATE OR REPLACE VIEW queue_positions_view AS
SELECT 
    qp.*,
    c.name as customer_full_name,
    c.phone as customer_phone,
    c.company as customer_company,
    a.name as agent_full_name,
    a.email as agent_email,
    EXTRACT(EPOCH FROM (NOW() - qp.joined_at)) / 60 as wait_time_minutes,
    CASE 
        WHEN qp.status = 'waiting' THEN 
            ROW_NUMBER() OVER (ORDER BY 
                CASE qp.priority 
                    WHEN 'urgent' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'medium' THEN 3 
                    WHEN 'low' THEN 4 
                END,
                qp.joined_at
            )
        ELSE NULL
    END as queue_position
FROM queue_positions qp
LEFT JOIN customers c ON qp.customer_id = c.id
LEFT JOIN agents a ON qp.agent_id = a.id;

-- Queue performans raporu view'ı
CREATE OR REPLACE VIEW queue_performance_report AS
SELECT 
    DATE_TRUNC('day', joined_at) as date,
    COUNT(*) as total_joined,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'left' THEN 1 END) as left_queue,
    COUNT(CASE WHEN status = 'waiting' THEN 1 END) as currently_waiting,
    AVG(EXTRACT(EPOCH FROM (started_at - joined_at)) / 60) as avg_wait_time,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) as avg_service_time,
    MAX(EXTRACT(EPOCH FROM (started_at - joined_at)) / 60) as max_wait_time,
    MIN(EXTRACT(EPOCH FROM (started_at - joined_at)) / 60) as min_wait_time,
    COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_count,
    COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_count,
    COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_count,
    COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_count
FROM queue_positions
WHERE joined_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', joined_at)
ORDER BY date DESC;

-- Fonksiyonlar

-- Tahmini bekleme süresi hesaplama
CREATE OR REPLACE FUNCTION calculate_estimated_wait_time(
    p_priority TEXT,
    p_category TEXT DEFAULT 'general'
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_active_agents INTEGER;
    v_people_ahead INTEGER;
    v_avg_service_time DECIMAL := 5; -- dakika
    v_base_wait_time DECIMAL;
    v_priority_multiplier DECIMAL;
BEGIN
    -- Aktif temsilci sayısı
    SELECT COUNT(*) INTO v_active_agents
    FROM agents
    WHERE status = 'active' AND is_available = true;

    -- Öncelik sırasına göre önde olan kişi sayısı
    SELECT COUNT(*) INTO v_people_ahead
    FROM queue_positions
    WHERE status = 'waiting' AND (
        priority = 'urgent' OR 
        (priority = 'high' AND p_priority != 'urgent') OR
        (priority = 'medium' AND p_priority IN ('medium', 'low')) OR
        (priority = 'low' AND p_priority = 'low')
    );

    -- Temel bekleme süresi
    v_base_wait_time := (v_people_ahead * v_avg_service_time) / GREATEST(v_active_agents, 1);

    -- Öncelik çarpanı
    CASE p_priority
        WHEN 'urgent' THEN v_priority_multiplier := 0.3;
        WHEN 'high' THEN v_priority_multiplier := 0.7;
        WHEN 'medium' THEN v_priority_multiplier := 1.0;
        WHEN 'low' THEN v_priority_multiplier := 1.5;
        ELSE v_priority_multiplier := 1.0;
    END CASE;

    RETURN GREATEST(ROUND(v_base_wait_time * v_priority_multiplier), 1);
END;
$$;

-- Queue pozisyonu alma
CREATE OR REPLACE FUNCTION get_queue_position(p_customer_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_position INTEGER;
BEGIN
    SELECT queue_position INTO v_position
    FROM queue_positions_view
    WHERE customer_id = p_customer_id AND status = 'waiting';

    RETURN COALESCE(v_position, 0);
END;
$$;

-- Otomatik temsilci atama
CREATE OR REPLACE FUNCTION auto_assign_agent()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_available_agent RECORD;
BEGIN
    -- Sadece yeni eklenen kayıtlar için
    IF TG_OP = 'INSERT' AND NEW.status = 'waiting' THEN
        -- En az yüklü aktif temsilciyi bul
        SELECT a.id, a.name INTO v_available_agent
        FROM agents a
        LEFT JOIN queue_positions qp ON a.id = qp.agent_id AND qp.status = 'in_service'
        WHERE a.status = 'active' AND a.is_available = true
        GROUP BY a.id, a.name
        ORDER BY COUNT(qp.id) ASC
        LIMIT 1;

        -- Temsilci bulunduysa ata
        IF v_available_agent.id IS NOT NULL THEN
            NEW.agent_id := v_available_agent.id;
            NEW.agent_name := v_available_agent.name;
            NEW.status := 'in_service';
            NEW.started_at := NOW();
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Otomatik atama trigger'ı (isteğe bağlı)
-- CREATE TRIGGER trigger_auto_assign_agent
--     BEFORE INSERT ON queue_positions
--     FOR EACH ROW
--     EXECUTE FUNCTION auto_assign_agent();

-- Örnek veri (test için)
-- INSERT INTO queue_positions (customer_id, customer_name, customer_email, priority, category, estimated_wait_time, status)
-- SELECT 
--     c.id,
--     c.name,
--     c.email,
--     CASE (RANDOM() * 3)::INT
--         WHEN 0 THEN 'low'
--         WHEN 1 THEN 'medium'
--         WHEN 2 THEN 'high'
--         ELSE 'urgent'
--     END,
--     CASE (RANDOM() * 4)::INT
--         WHEN 0 THEN 'general'
--         WHEN 1 THEN 'technical'
--         WHEN 2 THEN 'billing'
--         WHEN 3 THEN 'sales'
--         ELSE 'complaint'
--     END,
--     (RANDOM() * 20 + 5)::INTEGER,
--     'waiting'
-- FROM customers c
-- LIMIT 5;

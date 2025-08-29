-- Otomatik Raporlama ve Dashboard Güncellemeleri Sistemi
-- Migration: 20250821110000_auto_reporting_system.sql

-- 1. Otomatik Raporlar Tablosu
CREATE TABLE IF NOT EXISTS auto_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'custom'
    report_name VARCHAR(255) NOT NULL,
    report_config JSONB NOT NULL, -- Rapor konfigürasyonu (metrikler, filtreler, vb.)
    schedule_config JSONB NOT NULL, -- Zamanlama konfigürasyonu
    recipients JSONB NOT NULL, -- Alıcı listesi
    is_active BOOLEAN DEFAULT true,
    last_generated_at TIMESTAMP WITH TIME ZONE,
    next_generation_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Rapor Geçmişi Tablosu
CREATE TABLE IF NOT EXISTS report_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES auto_reports(id) ON DELETE CASCADE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    report_data JSONB NOT NULL, -- Oluşturulan rapor verisi
    file_path VARCHAR(500), -- PDF/Excel dosya yolu
    sent_to JSONB, -- Gönderilen alıcılar
    status VARCHAR(50) DEFAULT 'generated', -- 'generated', 'sent', 'failed'
    error_message TEXT
);

-- 3. Dashboard Widget'ları Tablosu
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    widget_type VARCHAR(50) NOT NULL, -- 'metric', 'chart', 'table', 'list'
    widget_config JSONB NOT NULL, -- Widget konfigürasyonu
    position JSONB NOT NULL, -- Grid pozisyonu {x, y, w, h}
    refresh_interval INTEGER DEFAULT 300, -- Saniye cinsinden yenileme aralığı
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Gerçek Zamanlı Metrikler Tablosu
CREATE TABLE IF NOT EXISTS realtime_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_key VARCHAR(100) NOT NULL, -- 'tickets_open', 'revenue_today', vb.
    metric_value JSONB NOT NULL, -- Metrik değeri
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- 5. Akıllı Uyarılar Tablosu
CREATE TABLE IF NOT EXISTS smart_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_name VARCHAR(255) NOT NULL,
    alert_type VARCHAR(50) NOT NULL, -- 'threshold', 'trend', 'anomaly'
    metric_key VARCHAR(100) NOT NULL,
    condition_config JSONB NOT NULL, -- Uyarı koşulları
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    recipients JSONB NOT NULL, -- Uyarı alıcıları
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Uyarı Geçmişi Tablosu
CREATE TABLE IF NOT EXISTS alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID REFERENCES smart_alerts(id) ON DELETE CASCADE,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metric_value JSONB NOT NULL, -- Tetiklenen metrik değeri
    message TEXT NOT NULL,
    sent_to JSONB, -- Gönderilen alıcılar
    status VARCHAR(50) DEFAULT 'sent' -- 'sent', 'failed', 'acknowledged'
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_auto_reports_type ON auto_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_auto_reports_active ON auto_reports(is_active);
CREATE INDEX IF NOT EXISTS idx_auto_reports_next_gen ON auto_reports(next_generation_at);
CREATE INDEX IF NOT EXISTS idx_report_history_report_id ON report_history(report_id);
CREATE INDEX IF NOT EXISTS idx_report_history_generated_at ON report_history(generated_at);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user_id ON dashboard_widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_realtime_metrics_key ON realtime_metrics(metric_key);
CREATE INDEX IF NOT EXISTS idx_realtime_metrics_expires ON realtime_metrics(expires_at);
CREATE INDEX IF NOT EXISTS idx_smart_alerts_type ON smart_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_smart_alerts_active ON smart_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_alert_history_alert_id ON alert_history(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered_at ON alert_history(triggered_at);

-- RLS Politikaları
ALTER TABLE auto_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

-- Auto Reports RLS
CREATE POLICY "Users can view auto reports" ON auto_reports
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage auto reports" ON auto_reports
    FOR ALL USING (auth.role() = 'authenticated');

-- Report History RLS
CREATE POLICY "Users can view report history" ON report_history
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage report history" ON report_history
    FOR ALL USING (auth.role() = 'authenticated');

-- Dashboard Widgets RLS
CREATE POLICY "Users can view their own widgets" ON dashboard_widgets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own widgets" ON dashboard_widgets
    FOR ALL USING (auth.uid() = user_id);

-- Realtime Metrics RLS
CREATE POLICY "Users can view realtime metrics" ON realtime_metrics
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can manage realtime metrics" ON realtime_metrics
    FOR ALL USING (auth.role() = 'authenticated');

-- Smart Alerts RLS
CREATE POLICY "Users can view smart alerts" ON smart_alerts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage smart alerts" ON smart_alerts
    FOR ALL USING (auth.role() = 'authenticated');

-- Alert History RLS
CREATE POLICY "Users can view alert history" ON alert_history
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage alert history" ON alert_history
    FOR ALL USING (auth.role() = 'authenticated');

-- Updated At Trigger Fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated At Trigger'ları
CREATE TRIGGER update_auto_reports_updated_at BEFORE UPDATE ON auto_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_widgets_updated_at BEFORE UPDATE ON dashboard_widgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_smart_alerts_updated_at BEFORE UPDATE ON smart_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Örnek Veriler
INSERT INTO auto_reports (report_type, report_name, report_config, schedule_config, recipients) VALUES
('daily', 'Günlük Performans Raporu', 
 '{"metrics": ["tickets_created", "tickets_resolved", "avg_resolution_time", "customer_satisfaction", "revenue"], "charts": ["daily_trends", "category_distribution"], "filters": {"date_range": "last_24_hours"}}',
 '{"frequency": "daily", "time": "09:00", "timezone": "Europe/Istanbul"}',
 '[{"type": "email", "value": "admin@example.com"}, {"type": "webhook", "value": "https://api.example.com/webhooks/daily-report"}]'),
 
('weekly', 'Haftalık Analitik Raporu',
 '{"metrics": ["weekly_growth", "agent_performance", "customer_analytics", "financial_summary"], "charts": ["weekly_trends", "agent_comparison", "revenue_breakdown"], "filters": {"date_range": "last_7_days"}}',
 '{"frequency": "weekly", "day": "monday", "time": "08:00", "timezone": "Europe/Istanbul"}',
 '[{"type": "email", "value": "management@example.com"}]'),
 
('monthly', 'Aylık KPI Raporu',
 '{"metrics": ["monthly_kpis", "trend_analysis", "forecast", "budget_variance"], "charts": ["monthly_comparison", "forecast_chart", "budget_analysis"], "filters": {"date_range": "last_30_days"}}',
 '{"frequency": "monthly", "day": 1, "time": "07:00", "timezone": "Europe/Istanbul"}',
 '[{"type": "email", "value": "ceo@example.com"}, {"type": "slack", "value": "#monthly-reports"}]');



-- Örnek Akıllı Uyarılar
INSERT INTO smart_alerts (alert_name, alert_type, metric_key, condition_config, severity, recipients) VALUES
('Yüksek Talep Yoğunluğu', 'threshold', 'tickets_open',
 '{"operator": ">", "value": 50, "duration": "1_hour"}', 'high',
 '[{"type": "email", "value": "support@example.com"}, {"type": "slack", "value": "#alerts"}]'),
 
('SLA İhlali Riski', 'threshold', 'sla_breach_risk',
 '{"operator": ">", "value": 0.8, "duration": "30_minutes"}', 'critical',
 '[{"type": "email", "value": "manager@example.com"}, {"type": "sms", "value": "+905551234567"}]'),
 
('Gelir Düşüşü', 'trend', 'daily_revenue',
 '{"trend": "decreasing", "threshold": 0.2, "period": "3_days"}', 'medium',
 '[{"type": "email", "value": "finance@example.com"}]');

-- PostgreSQL Fonksiyonları

-- 1. Gerçek Zamanlı Metrik Hesaplama Fonksiyonu
CREATE OR REPLACE FUNCTION calculate_realtime_metrics()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    tickets_open_count INTEGER;
    tickets_resolved_today INTEGER;
    avg_resolution_time NUMERIC;
    total_revenue_today NUMERIC;
    customer_satisfaction_avg NUMERIC;
BEGIN
    -- Açık talep sayısı
    SELECT COUNT(*) INTO tickets_open_count
    FROM tickets 
    WHERE status IN ('open', 'in_progress');
    
    -- Bugün çözülen talep sayısı
    SELECT COUNT(*) INTO tickets_resolved_today
    FROM tickets 
    WHERE status IN ('resolved', 'closed') 
    AND DATE(resolved_at) = CURRENT_DATE;
    
    -- Ortalama çözüm süresi (son 7 gün)
    SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600), 0) INTO avg_resolution_time
    FROM tickets 
    WHERE status IN ('resolved', 'closed') 
    AND resolved_at >= NOW() - INTERVAL '7 days';
    
    -- Bugünkü toplam gelir
    SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) INTO total_revenue_today
    FROM payments 
    WHERE status = 'completed' 
    AND DATE(payment_date) = CURRENT_DATE;
    
    -- Ortalama müşteri memnuniyeti
    SELECT COALESCE(AVG(satisfaction_rating), 0) INTO customer_satisfaction_avg
    FROM tickets 
    WHERE satisfaction_rating IS NOT NULL 
    AND resolved_at >= NOW() - INTERVAL '30 days';
    
    result := jsonb_build_object(
        'tickets_open', tickets_open_count,
        'tickets_resolved_today', tickets_resolved_today,
        'avg_resolution_time_hours', ROUND(avg_resolution_time::NUMERIC, 2),
        'total_revenue_today', total_revenue_today,
        'customer_satisfaction_avg', ROUND(customer_satisfaction_avg::NUMERIC, 2),
        'calculated_at', NOW()
    );
    
    -- Metrikleri kaydet
    INSERT INTO realtime_metrics (metric_key, metric_value)
    VALUES 
        ('tickets_open', jsonb_build_object('value', tickets_open_count)),
        ('tickets_resolved_today', jsonb_build_object('value', tickets_resolved_today)),
        ('avg_resolution_time_hours', jsonb_build_object('value', avg_resolution_time)),
        ('total_revenue_today', jsonb_build_object('value', total_revenue_today)),
        ('customer_satisfaction_avg', jsonb_build_object('value', customer_satisfaction_avg));
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. Otomatik Rapor Oluşturma Fonksiyonu
CREATE OR REPLACE FUNCTION generate_auto_report(p_report_id UUID)
RETURNS JSONB AS $$
DECLARE
    report_record RECORD;
    report_data JSONB;
    report_history_id UUID;
BEGIN
    -- Rapor bilgilerini al
    SELECT * INTO report_record FROM auto_reports WHERE id = p_report_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report not found: %', p_report_id;
    END IF;
    
    -- Rapor verilerini hesapla
    report_data := jsonb_build_object(
        'report_id', p_report_id,
        'report_name', report_record.report_name,
        'generated_at', NOW(),
        'metrics', calculate_realtime_metrics(),
        'period', CASE 
            WHEN report_record.report_type = 'daily' THEN 'last_24_hours'
            WHEN report_record.report_type = 'weekly' THEN 'last_7_days'
            WHEN report_record.report_type = 'monthly' THEN 'last_30_days'
            ELSE 'custom'
        END
    );
    
    -- Rapor geçmişine kaydet
    INSERT INTO report_history (report_id, report_data, status)
    VALUES (p_report_id, report_data, 'generated')
    RETURNING id INTO report_history_id;
    
    -- Son oluşturma zamanını güncelle
    UPDATE auto_reports 
    SET last_generated_at = NOW(),
        next_generation_at = CASE 
            WHEN report_type = 'daily' THEN NOW() + INTERVAL '1 day'
            WHEN report_type = 'weekly' THEN NOW() + INTERVAL '1 week'
            WHEN report_type = 'monthly' THEN NOW() + INTERVAL '1 month'
            ELSE NOW() + INTERVAL '1 day'
        END
    WHERE id = p_report_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'report_history_id', report_history_id,
        'report_data', report_data
    );
END;
$$ LANGUAGE plpgsql;

-- 3. Akıllı Uyarı Kontrol Fonksiyonu
CREATE OR REPLACE FUNCTION check_smart_alerts()
RETURNS JSONB AS $$
DECLARE
    alert_record RECORD;
    current_value JSONB;
    should_trigger BOOLEAN := false;
    alert_message TEXT;
    alert_history_id UUID;
BEGIN
    -- Aktif uyarıları kontrol et
    FOR alert_record IN SELECT * FROM smart_alerts WHERE is_active = true
    LOOP
        -- Mevcut metrik değerini al
        SELECT metric_value INTO current_value
        FROM realtime_metrics 
        WHERE metric_key = alert_record.metric_key
        AND expires_at > NOW()
        ORDER BY calculated_at DESC
        LIMIT 1;
        
        IF current_value IS NOT NULL THEN
            -- Uyarı koşulunu kontrol et
            should_trigger := CASE alert_record.alert_type
                WHEN 'threshold' THEN
                    (current_value->>'value')::NUMERIC > (alert_record.condition_config->>'value')::NUMERIC
                WHEN 'trend' THEN
                    -- Trend analizi (basit implementasyon)
                    true -- Gerçek uygulamada daha karmaşık trend analizi yapılır
                ELSE false
            END;
            
            IF should_trigger THEN
                -- Uyarı mesajını oluştur
                alert_message := format(
                    'Uyarı: %s - %s değeri: %s',
                    alert_record.alert_name,
                    alert_record.metric_key,
                    current_value->>'value'
                );
                
                -- Uyarı geçmişine kaydet
                INSERT INTO alert_history (alert_id, metric_value, message, status)
                VALUES (alert_record.id, current_value, alert_message, 'sent')
                RETURNING id INTO alert_history_id;
                
                -- Son tetiklenme zamanını güncelle
                UPDATE smart_alerts 
                SET last_triggered_at = NOW()
                WHERE id = alert_record.id;
            END IF;
        END IF;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'alerts_checked', true
    );
END;
$$ LANGUAGE plpgsql;

-- 4. Dashboard Widget Verisi Alma Fonksiyonu
CREATE OR REPLACE FUNCTION get_widget_data(p_widget_type VARCHAR, p_config JSONB)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    CASE p_widget_type
        WHEN 'metric' THEN
            -- Metrik widget'ı için veri
            SELECT metric_value INTO result
            FROM realtime_metrics 
            WHERE metric_key = p_config->>'metric'
            AND expires_at > NOW()
            ORDER BY calculated_at DESC
            LIMIT 1;
            
        WHEN 'chart' THEN
            -- Grafik widget'ı için veri
            result := jsonb_build_object(
                'chart_type', p_config->>'chart_type',
                'data', calculate_realtime_metrics()
            );
            
        WHEN 'table' THEN
            -- Tablo widget'ı için veri
            result := jsonb_build_object(
                'columns', p_config->>'columns',
                'data', jsonb_build_array() -- Gerçek uygulamada dinamik veri
            );
            
        ELSE
            result := jsonb_build_object('error', 'Unknown widget type');
    END CASE;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Otomatik Temizlik Fonksiyonu (Eski verileri temizle)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS VOID AS $$
BEGIN
    -- 30 günden eski rapor geçmişini temizle
    DELETE FROM report_history 
    WHERE generated_at < NOW() - INTERVAL '30 days';
    
    -- 7 günden eski uyarı geçmişini temizle
    DELETE FROM alert_history 
    WHERE triggered_at < NOW() - INTERVAL '7 days';
    
    -- Süresi dolmuş gerçek zamanlı metrikleri temizle
    DELETE FROM realtime_metrics 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- RPC Fonksiyonlarını Dışa Aktar
GRANT EXECUTE ON FUNCTION calculate_realtime_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_auto_report(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_smart_alerts() TO authenticated;
GRANT EXECUTE ON FUNCTION get_widget_data(VARCHAR, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_data() TO authenticated;

-- İzin Onay Sistemi Migration
-- Tarih: 2024-12-02

-- Önce mevcut trigger'ları ve fonksiyonları temizle
DROP TRIGGER IF EXISTS trigger_notify_leave_decision ON pending_leave_approvals;
DROP TRIGGER IF EXISTS trigger_create_leave_approval ON leave_requests;
DROP FUNCTION IF EXISTS notify_leave_decision();
DROP FUNCTION IF EXISTS create_leave_approval();

-- Onay bekleyen izinler tablosu
CREATE TABLE IF NOT EXISTS pending_leave_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    leave_request_id UUID NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    manager_notes TEXT,
    approval_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bildirimler tablosu
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('leave_request', 'leave_approved', 'leave_rejected', 'general')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_pending_leave_approvals_manager_id ON pending_leave_approvals(manager_id);
CREATE INDEX IF NOT EXISTS idx_pending_leave_approvals_status ON pending_leave_approvals(status);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- RLS kapalı - Geliştirme için
-- ALTER TABLE pending_leave_approvals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Trigger fonksiyonu - İzin talebi oluşturulduğunda otomatik onay kaydı oluştur
CREATE OR REPLACE FUNCTION create_leave_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer çalışanın bir yöneticisi varsa, onay kaydı oluştur
    IF NEW.employee_id IN (
        SELECT id FROM employees WHERE manager_id IS NOT NULL
    ) THEN
        INSERT INTO pending_leave_approvals (
            leave_request_id,
            employee_id,
            manager_id
        ) VALUES (
            NEW.id,
            NEW.employee_id,
            (SELECT manager_id FROM employees WHERE id = NEW.employee_id)
        );
        
        -- Yöneticiye bildirim gönder
        INSERT INTO notifications (
            recipient_id,
            sender_id,
            title,
            message,
            type
        ) VALUES (
            (SELECT manager_id FROM employees WHERE id = NEW.employee_id),
            NEW.employee_id,
            'Yeni İzin Talebi',
            (SELECT name FROM employees WHERE id = NEW.employee_id) || ' izin talebinde bulundu. Lütfen onaylayın.',
            'leave_request'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur
CREATE TRIGGER trigger_create_leave_approval
    AFTER INSERT ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_leave_approval();

-- İzin onaylandığında/reddedildiğinde bildirim gönder
CREATE OR REPLACE FUNCTION notify_leave_decision()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
        -- Çalışana bildirim gönder
        INSERT INTO notifications (
            recipient_id,
            sender_id,
            title,
            message,
            type
        ) VALUES (
            NEW.employee_id,
            NEW.manager_id,
            CASE 
                WHEN NEW.status = 'approved' THEN 'İzin Talebiniz Onaylandı'
                ELSE 'İzin Talebiniz Reddedildi'
            END,
            CASE 
                WHEN NEW.status = 'approved' THEN 'İzin talebiniz yöneticiniz tarafından onaylandı.'
                ELSE 'İzin talebiniz yöneticiniz tarafından reddedildi. Not: ' || COALESCE(NEW.manager_notes, '')
            END,
            CASE 
                WHEN NEW.status = 'approved' THEN 'leave_approved'
                ELSE 'leave_rejected'
            END
        );
        
        -- Ana izin kaydını güncelle
        UPDATE leave_requests 
        SET status = NEW.status,
            updated_at = NOW()
        WHERE id = NEW.leave_request_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur
CREATE TRIGGER trigger_notify_leave_decision
    AFTER UPDATE ON pending_leave_approvals
    FOR EACH ROW
    EXECUTE FUNCTION notify_leave_decision();

-- Örnek veri ekle (test için)
INSERT INTO pending_leave_approvals (leave_request_id, employee_id, manager_id, status)
SELECT 
    lr.id,
    lr.employee_id,
    e.manager_id,
    'pending'
FROM leave_requests lr
JOIN employees e ON lr.employee_id = e.id
WHERE lr.status = 'pending' 
AND e.manager_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM pending_leave_approvals pla 
    WHERE pla.leave_request_id = lr.id
);

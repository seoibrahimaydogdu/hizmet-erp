-- İzin Talepleri Tablosu
-- Tarih: 2024-12-01

-- İzin talepleri tablosu
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    days_requested INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_date_range ON leave_requests(start_date, end_date);

-- RLS kapalı - Geliştirme için
-- ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Örnek veri ekle
INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, days_requested, status)
SELECT 
    e.id,
    CASE 
        WHEN random() < 0.4 THEN 'annual'
        WHEN random() < 0.7 THEN 'sick'
        WHEN random() < 0.85 THEN 'personal'
        ELSE 'unpaid'
    END,
    CURRENT_DATE + (random() * 30)::integer,
    CURRENT_DATE + (random() * 30 + 1)::integer,
    CASE 
        WHEN random() < 0.3 THEN 'Aile ziyareti'
        WHEN random() < 0.6 THEN 'Sağlık sorunu'
        WHEN random() < 0.8 THEN 'Kişisel işler'
        ELSE 'Acil durum'
    END,
    (random() * 5 + 1)::integer,
    CASE 
        WHEN random() < 0.6 THEN 'pending'
        WHEN random() < 0.8 THEN 'approved'
        ELSE 'rejected'
    END
FROM employees e
WHERE e.manager_id IS NOT NULL
LIMIT 10;

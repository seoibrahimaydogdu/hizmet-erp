-- Çalışanlar Tablosu
-- Tarih: 2024-12-01

-- Çalışanlar tablosu
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    position VARCHAR(255) NOT NULL,
    title VARCHAR(100) DEFAULT 'Çalışan',
    department VARCHAR(100) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id UUID REFERENCES employees(id),
    team_size INTEGER DEFAULT 0,
    reporting_level INTEGER DEFAULT 1,
    skills TEXT[] DEFAULT ARRAY[]::TEXT[],
    performance_score INTEGER DEFAULT 0 CHECK (performance_score >= 0 AND performance_score <= 100),
    attendance_rate INTEGER DEFAULT 100 CHECK (attendance_rate >= 0 AND attendance_rate <= 100),
    leave_balance INTEGER DEFAULT 20 CHECK (leave_balance >= 0),
    career_goals TEXT[] DEFAULT ARRAY[]::TEXT[],
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
    phone VARCHAR(20),
    address TEXT,
    education TEXT,
    experience_years INTEGER,
    salary DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- RLS kapalı - Geliştirme için
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Örnek veri ekle (eğer tablo boşsa)
INSERT INTO employees (name, email, position, title, department, hire_date, manager_id, team_size, skills, performance_score, attendance_rate, leave_balance, career_goals, status)
SELECT * FROM (VALUES
    ('Ahmet Yılmaz', 'ahmet.yilmaz@company.com', 'Genel Müdür', 'Genel Müdür', 'Yönetim', '2020-01-15'::DATE, NULL, 5, ARRAY['Liderlik', 'Strateji', 'Yönetim'], 95, 98, 25, ARRAY['Şirket büyütme', 'Pazar genişletme'], 'active'),
    ('Fatma Demir', 'fatma.demir@company.com', 'İK Müdürü', 'İK Müdürü', 'İnsan Kaynakları', '2021-03-10'::DATE, (SELECT id FROM employees WHERE title = 'Genel Müdür' LIMIT 1), 3, ARRAY['İK Yönetimi', 'İşe Alım', 'Performans'], 88, 96, 22, ARRAY['İK süreçlerini iyileştirme'], 'active'),
    ('Mehmet Kaya', 'mehmet.kaya@company.com', 'Teknoloji Müdürü', 'Teknoloji Müdürü', 'Teknoloji', '2021-06-20'::DATE, (SELECT id FROM employees WHERE title = 'Genel Müdür' LIMIT 1), 8, ARRAY['Yazılım Geliştirme', 'Proje Yönetimi', 'Agile'], 92, 97, 20, ARRAY['Dijital dönüşüm'], 'active'),
    ('Ayşe Özkan', 'ayse.ozkan@company.com', 'Satış Müdürü', 'Satış Müdürü', 'Satış', '2021-09-15'::DATE, (SELECT id FROM employees WHERE title = 'Genel Müdür' LIMIT 1), 6, ARRAY['Satış Stratejisi', 'Müşteri İlişkileri', 'Pazarlama'], 90, 95, 18, ARRAY['Satış hedeflerini aşma'], 'active'),
    ('Ali Çelik', 'ali.celik@company.com', 'Yazılım Geliştirici', 'Çalışan', 'Teknoloji', '2022-01-10'::DATE, (SELECT id FROM employees WHERE title = 'Teknoloji Müdürü' LIMIT 1), 0, ARRAY['React', 'Node.js', 'PostgreSQL'], 85, 94, 15, ARRAY['Full-stack geliştirici olma'], 'active'),
    ('Zeynep Arslan', 'zeynep.arslan@company.com', 'İK Uzmanı', 'Çalışan', 'İnsan Kaynakları', '2022-02-20'::DATE, (SELECT id FROM employees WHERE title = 'İK Müdürü' LIMIT 1), 0, ARRAY['İşe Alım', 'Eğitim', 'Performans'], 82, 93, 16, ARRAY['İK müdürü olma'], 'active'),
    ('Can Yıldız', 'can.yildiz@company.com', 'Satış Temsilcisi', 'Çalışan', 'Satış', '2022-03-05'::DATE, (SELECT id FROM employees WHERE title = 'Satış Müdürü' LIMIT 1), 0, ARRAY['Müşteri İlişkileri', 'Satış Teknikleri'], 78, 91, 12, ARRAY['Satış müdürü olma'], 'active'),
    ('Elif Koç', 'elif.koc@company.com', 'Frontend Geliştirici', 'Çalışan', 'Teknoloji', '2022-04-12'::DATE, (SELECT id FROM employees WHERE title = 'Teknoloji Müdürü' LIMIT 1), 0, ARRAY['React', 'TypeScript', 'CSS'], 80, 92, 14, ARRAY['UI/UX uzmanı olma'], 'active')
) AS v(name, email, position, title, department, hire_date, manager_id, team_size, skills, performance_score, attendance_rate, leave_balance, career_goals, status)
WHERE NOT EXISTS (SELECT 1 FROM employees LIMIT 1);

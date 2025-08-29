-- Eksik Proje Yönetimi Tablolarını Oluştur
-- Tarih: 2024-12-15

-- Proje kaynakları tablosu
CREATE TABLE IF NOT EXISTS project_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    availability INTEGER DEFAULT 40 CHECK (availability > 0),
    current_load INTEGER DEFAULT 0 CHECK (current_load >= 0),
    skills TEXT[] DEFAULT '{}',
    hourly_rate DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proje görevleri tablosu
CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    assigned_to UUID REFERENCES project_resources(id) ON DELETE SET NULL,
    estimated_hours INTEGER DEFAULT 0,
    actual_hours INTEGER DEFAULT 0,
    start_date DATE,
    due_date DATE,
    dependencies UUID[] DEFAULT '{}',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk analizi tablosu
CREATE TABLE IF NOT EXISTS project_risks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    risk_type VARCHAR(50) NOT NULL CHECK (risk_type IN ('budget', 'schedule', 'resource', 'technical')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
    impact INTEGER DEFAULT 50 CHECK (impact >= 0 AND impact <= 100),
    mitigation_strategy TEXT,
    status VARCHAR(50) DEFAULT 'identified' CHECK (status IN ('identified', 'monitoring', 'mitigated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Örnek veriler ekle
INSERT INTO project_resources (name, role, availability, current_load, skills, hourly_rate, status) VALUES
('Ahmet Yılmaz', 'Proje Yöneticisi', 40, 20, ARRAY['Proje Yönetimi', 'Agile', 'Scrum'], 150.00, 'active'),
('Ayşe Demir', 'Geliştirici', 40, 35, ARRAY['React', 'TypeScript', 'Node.js'], 120.00, 'active'),
('Mehmet Kaya', 'Tasarımcı', 40, 15, ARRAY['UI/UX', 'Figma', 'Adobe Creative Suite'], 100.00, 'active'),
('Fatma Özkan', 'Test Uzmanı', 40, 25, ARRAY['QA', 'Automation', 'Selenium'], 110.00, 'active'),
('Ali Çelik', 'DevOps', 40, 30, ARRAY['Docker', 'Kubernetes', 'AWS'], 130.00, 'active');

-- Başarı mesajı
SELECT 'Tablolar başarıyla oluşturuldu ve örnek veriler eklendi!' as message;

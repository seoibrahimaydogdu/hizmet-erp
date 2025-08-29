-- Proje Yönetimi Tabloları
-- Tarih: 2024-12-15

-- Projeler tablosu
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'on_hold')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget DECIMAL(15,2) DEFAULT 0,
    actual_cost DECIMAL(15,2) DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    team_size INTEGER DEFAULT 1,
    risk_level VARCHAR(50) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
    customer_id UUID,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Proje aşamaları tablosu
CREATE TABLE IF NOT EXISTS project_phases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE,
    end_date DATE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proje zaman çizelgesi tablosu
CREATE TABLE IF NOT EXISTS project_timeline (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES project_phases(id) ON DELETE CASCADE,
    task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    assigned_resources UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) devre dışı - Geliştirme aşamasında
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE project_resources ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE project_risks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE project_timeline ENABLE ROW LEVEL SECURITY;

-- RLS politikaları devre dışı - Geliştirme aşamasında
-- CREATE POLICY "Projeleri görüntüle" ON projects
--     FOR SELECT USING (true);

-- CREATE POLICY "Proje oluştur" ON projects
--     FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Proje güncelle" ON projects
--     FOR UPDATE USING (true);

-- CREATE POLICY "Proje sil" ON projects
--     FOR DELETE USING (true);

-- CREATE POLICY "Kaynakları görüntüle" ON project_resources
--     FOR SELECT USING (true);

-- CREATE POLICY "Kaynak oluştur" ON project_resources
--     FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Kaynak güncelle" ON project_resources
--     FOR UPDATE USING (true);

-- CREATE POLICY "Kaynak sil" ON project_resources
--     FOR DELETE USING (true);

-- CREATE POLICY "Görevleri görüntüle" ON project_tasks
--     FOR SELECT USING (true);

-- CREATE POLICY "Görev oluştur" ON project_tasks
--     FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Görev güncelle" ON project_tasks
--     FOR UPDATE USING (true);

-- CREATE POLICY "Görev sil" ON project_tasks
--     FOR DELETE USING (true);

-- CREATE POLICY "Riskleri görüntüle" ON project_risks
--     FOR SELECT USING (true);

-- CREATE POLICY "Risk oluştur" ON project_risks
--     FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Risk güncelle" ON project_risks
--     FOR UPDATE USING (true);

-- CREATE POLICY "Risk sil" ON project_risks
--     FOR DELETE USING (true);

-- CREATE POLICY "Aşamaları görüntüle" ON project_phases
--     FOR SELECT USING (true);

-- CREATE POLICY "Aşama oluştur" ON project_phases
--     FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Aşama güncelle" ON project_phases
--     FOR UPDATE USING (true);

-- CREATE POLICY "Aşama sil" ON project_phases
--     FOR DELETE USING (true);

-- CREATE POLICY "Zaman çizelgesini görüntüle" ON project_timeline
--     FOR SELECT USING (true);

-- CREATE POLICY "Zaman çizelgesi oluştur" ON project_timeline
--     FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Zaman çizelgesi güncelle" ON project_timeline
--     FOR UPDATE USING (true);

-- CREATE POLICY "Zaman çizelgesi sil" ON project_timeline
--     FOR DELETE USING (true);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_risks_project_id ON project_risks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_phases_project_id ON project_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_project_timeline_project_id ON project_timeline(project_id);

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger'ları oluştur
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_resources_updated_at BEFORE UPDATE ON project_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_tasks_updated_at BEFORE UPDATE ON project_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_risks_updated_at BEFORE UPDATE ON project_risks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_phases_updated_at BEFORE UPDATE ON project_phases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Proje ilerlemesini otomatik güncelleyen fonksiyon
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Proje aşamalarının ortalama ilerlemesini hesapla
    UPDATE projects 
    SET progress = (
        SELECT COALESCE(AVG(progress), 0)
        FROM project_phases 
        WHERE project_id = NEW.project_id
    )
    WHERE id = NEW.project_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aşama güncellendiğinde proje ilerlemesini güncelle
CREATE TRIGGER update_project_progress_trigger 
    AFTER UPDATE ON project_phases
    FOR EACH ROW EXECUTE FUNCTION update_project_progress();

-- Örnek veriler ekle
INSERT INTO project_resources (name, role, availability, current_load, skills, hourly_rate) VALUES
('Ahmet Yılmaz', 'Proje Yöneticisi', 40, 35, ARRAY['Proje Yönetimi', 'Agile', 'Scrum'], 150),
('Fatma Demir', 'Frontend Geliştirici', 40, 40, ARRAY['React', 'TypeScript', 'UI/UX'], 120),
('Mehmet Kaya', 'Backend Geliştirici', 40, 30, ARRAY['Node.js', 'PostgreSQL', 'API'], 130),
('Ayşe Özkan', 'UI/UX Tasarımcı', 40, 25, ARRAY['Figma', 'Adobe XD', 'Prototyping'], 100),
('Can Yıldız', 'DevOps Mühendisi', 40, 20, ARRAY['Docker', 'Kubernetes', 'AWS'], 140);

-- Örnek projeler
INSERT INTO projects (name, description, status, priority, start_date, end_date, budget, actual_cost, progress, team_size, risk_level, customer_id) VALUES
('E-ticaret Platformu Geliştirme', 'Modern e-ticaret platformu geliştirme projesi', 'active', 'high', '2024-01-15', '2024-06-30', 150000, 85000, 65, 8, 'medium', NULL),
('Mobil Uygulama Geliştirme', 'iOS ve Android mobil uygulama geliştirme', 'planning', 'medium', '2024-03-01', '2024-08-31', 80000, 0, 15, 5, 'low', NULL),
('CRM Sistemi Entegrasyonu', 'Müşteri ilişkileri yönetimi sistemi entegrasyonu', 'active', 'high', '2024-02-01', '2024-05-31', 120000, 60000, 45, 6, 'medium', NULL);

-- Örnek aşamalar
INSERT INTO project_phases (project_id, name, description, duration, progress, order_index) VALUES
((SELECT id FROM projects WHERE name = 'E-ticaret Platformu Geliştirme'), 'Planlama', 'Proje planlaması ve gereksinim analizi', 10, 100, 1),
((SELECT id FROM projects WHERE name = 'E-ticaret Platformu Geliştirme'), 'Tasarım', 'UI/UX tasarımı ve prototip oluşturma', 15, 100, 2),
((SELECT id FROM projects WHERE name = 'E-ticaret Platformu Geliştirme'), 'Geliştirme', 'Frontend ve backend geliştirme', 40, 65, 3),
((SELECT id FROM projects WHERE name = 'E-ticaret Platformu Geliştirme'), 'Test', 'Sistem testleri ve kalite kontrol', 20, 0, 4),
((SELECT id FROM projects WHERE name = 'E-ticaret Platformu Geliştirme'), 'Deployment', 'Canlıya alma ve yayınlama', 15, 0, 5);

-- Örnek görevler
INSERT INTO project_tasks (project_id, name, description, status, priority, assigned_to, estimated_hours, actual_hours, progress) VALUES
((SELECT id FROM projects WHERE name = 'E-ticaret Platformu Geliştirme'), 'Veritabanı Tasarımı', 'E-ticaret için veritabanı şeması oluşturma', 'completed', 'high', (SELECT id FROM project_resources WHERE name = 'Mehmet Kaya'), 16, 14, 100),
((SELECT id FROM projects WHERE name = 'E-ticaret Platformu Geliştirme'), 'Ana Sayfa Tasarımı', 'E-ticaret ana sayfası UI tasarımı', 'completed', 'high', (SELECT id FROM project_resources WHERE name = 'Ayşe Özkan'), 24, 22, 100),
((SELECT id FROM projects WHERE name = 'E-ticaret Platformu Geliştirme'), 'Ürün Listesi Sayfası', 'Ürün listeleme ve filtreleme sayfası', 'in_progress', 'medium', (SELECT id FROM project_resources WHERE name = 'Fatma Demir'), 32, 20, 62);

-- Örnek riskler
INSERT INTO project_risks (project_id, risk_type, title, description, probability, impact, mitigation_strategy, status) VALUES
((SELECT id FROM projects WHERE name = 'E-ticaret Platformu Geliştirme'), 'schedule', 'Geliştirme süresi aşımı', 'Frontend geliştirme süresi planlanandan uzun sürebilir', 60, 70, 'Ek geliştirici kaynağı ekleme ve paralel çalışma', 'monitoring'),
((SELECT id FROM projects WHERE name = 'E-ticaret Platformu Geliştirme'), 'budget', 'Bütçe aşımı riski', 'Üçüncü parti entegrasyonları bütçeyi aşabilir', 40, 80, 'Alternatif çözümler araştırma ve maliyet optimizasyonu', 'identified'),
((SELECT id FROM projects WHERE name = 'Mobil Uygulama Geliştirme'), 'technical', 'Platform uyumluluğu', 'iOS ve Android platformları arasında uyumluluk sorunları', 30, 60, 'Cross-platform framework kullanımı ve erken test', 'identified');

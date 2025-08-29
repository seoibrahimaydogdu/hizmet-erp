-- İK Yönetimi için gerekli tablolar

-- Çalışanlar tablosu
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  position VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  hire_date DATE NOT NULL,
  skills TEXT[] DEFAULT '{}',
  performance_score DECIMAL(3,1) DEFAULT 0.0 CHECK (performance_score >= 0 AND performance_score <= 10),
  attendance_rate DECIMAL(5,2) DEFAULT 100.0 CHECK (attendance_rate >= 0 AND attendance_rate <= 100),
  leave_balance INTEGER DEFAULT 20 CHECK (leave_balance >= 0),
  career_goals TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Eksik sütunları ekle (eğer tablo zaten varsa)
DO $$ 
BEGIN
    -- title sütunu ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'title') THEN
        ALTER TABLE employees ADD COLUMN title VARCHAR(100) NOT NULL DEFAULT 'Çalışan';
    END IF;
    
    -- manager_id sütunu ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'manager_id') THEN
        ALTER TABLE employees ADD COLUMN manager_id UUID REFERENCES employees(id);
    END IF;
    
    -- team_size sütunu ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'team_size') THEN
        ALTER TABLE employees ADD COLUMN team_size INTEGER DEFAULT 0 CHECK (team_size >= 0);
    END IF;
    
    -- reporting_level sütunu ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'reporting_level') THEN
        ALTER TABLE employees ADD COLUMN reporting_level INTEGER DEFAULT 1 CHECK (reporting_level >= 1);
    END IF;
    
    -- phone sütunu ekle (EmployeeProfile için)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'phone') THEN
        ALTER TABLE employees ADD COLUMN phone VARCHAR(20) DEFAULT '';
    END IF;
    
    -- salary sütunu ekle (EmployeeProfile için)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'salary') THEN
        ALTER TABLE employees ADD COLUMN salary DECIMAL(10,2) DEFAULT 0.0;
    END IF;
END $$;

-- Beceriler tablosu
CREATE TABLE IF NOT EXISTS skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  level VARCHAR(20) NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  employees UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performans değerlendirmeleri tablosu
CREATE TABLE IF NOT EXISTS performance_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  score DECIMAL(3,1) NOT NULL CHECK (score >= 0 AND score <= 10),
  feedback TEXT NOT NULL,
  goals TEXT[] DEFAULT '{}',
  review_date DATE NOT NULL,
  next_review_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İzin talepleri tablosu
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type VARCHAR(20) NOT NULL CHECK (leave_type IN ('annual', 'sick', 'personal', 'maternity', 'paternity')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Yeterlilik değerlendirmeleri tablosu
CREATE TABLE IF NOT EXISTS competency_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  assessor_id UUID NOT NULL,
  current_level VARCHAR(20) NOT NULL CHECK (current_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  target_level VARCHAR(20) NOT NULL CHECK (target_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  assessment_date DATE NOT NULL,
  notes TEXT,
  next_assessment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kariyer hedefleri ve gelişim planları tablosu
CREATE TABLE IF NOT EXISTS career_development_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  mentor_id UUID,
  current_position VARCHAR(255) NOT NULL,
  target_position VARCHAR(255) NOT NULL,
  timeline_months INTEGER NOT NULL CHECK (timeline_months > 0),
  required_skills TEXT[] DEFAULT '{}',
  action_items TEXT[] DEFAULT '{}',
  progress_percentage DECIMAL(5,2) DEFAULT 0.0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  start_date DATE NOT NULL,
  target_completion_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verimlilik metrikleri tablosu
CREATE TABLE IF NOT EXISTS productivity_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  tasks_completed INTEGER DEFAULT 0 CHECK (tasks_completed >= 0),
  tasks_assigned INTEGER DEFAULT 0 CHECK (tasks_assigned >= 0),
  hours_worked DECIMAL(4,2) DEFAULT 0.0 CHECK (hours_worked >= 0),
  quality_score DECIMAL(3,1) DEFAULT 0.0 CHECK (quality_score >= 0 AND quality_score <= 10),
  efficiency_score DECIMAL(3,1) DEFAULT 0.0 CHECK (efficiency_score >= 0 AND efficiency_score <= 10),
  collaboration_score DECIMAL(3,1) DEFAULT 0.0 CHECK (collaboration_score >= 0 AND collaboration_score <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gelişim aktiviteleri tablosu
CREATE TABLE IF NOT EXISTS development_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('training', 'mentoring', 'project', 'certification', 'workshop', 'conference')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  completion_percentage DECIMAL(5,2) DEFAULT 0.0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  skills_developed TEXT[] DEFAULT '{}',
  certificate_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İzin takip detayları tablosu
CREATE TABLE IF NOT EXISTS leave_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type VARCHAR(20) NOT NULL CHECK (leave_type IN ('annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid')),
  year INTEGER NOT NULL,
  total_allocated INTEGER DEFAULT 0 CHECK (total_allocated >= 0),
  total_used INTEGER DEFAULT 0 CHECK (total_used >= 0),
  total_remaining INTEGER DEFAULT 0 CHECK (total_remaining >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, leave_type, year)
);

-- Örnek veriler ekle (sadece mevcut olmayan veriler)
INSERT INTO employees (name, email, position, title, department, hire_date, manager_id, team_size, reporting_level, phone, salary, skills, performance_score, attendance_rate, leave_balance, career_goals) 
SELECT 'Ahmet Yılmaz', 'ahmet.yilmaz@company.com', 'Yazılım Geliştirici', 'Uzman', 'Teknoloji', '2023-01-15'::DATE, NULL, 0, 1, '+90 555 123 4567', 15000.00, ARRAY['JavaScript', 'React', 'Node.js'], 8.5, 95.2, 15, ARRAY['Senior Developer olmak', 'Team Lead pozisyonuna yükselmek']
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'ahmet.yilmaz@company.com');

INSERT INTO employees (name, email, position, title, department, hire_date, manager_id, team_size, reporting_level, phone, salary, skills, performance_score, attendance_rate, leave_balance, career_goals) 
SELECT 'Ayşe Demir', 'ayse.demir@company.com', 'Müşteri Temsilcisi', 'Uzman', 'Müşteri Hizmetleri', '2022-06-20'::DATE, NULL, 0, 1, '+90 555 234 5678', 12000.00, ARRAY['Müşteri İlişkileri', 'CRM', 'İletişim'], 7.8, 98.1, 12, ARRAY['Müşteri Hizmetleri Müdürü olmak', 'Eğitmen olmak']
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'ayse.demir@company.com');

INSERT INTO employees (name, email, position, title, department, hire_date, manager_id, team_size, reporting_level, phone, salary, skills, performance_score, attendance_rate, leave_balance, career_goals) 
SELECT 'Mehmet Kaya', 'mehmet.kaya@company.com', 'Satış Temsilcisi', 'Uzman', 'Satış', '2023-03-10'::DATE, NULL, 0, 1, '+90 555 345 6789', 14000.00, ARRAY['Satış Teknikleri', 'Pazarlama', 'Müzakere'], 9.2, 92.5, 8, ARRAY['Satış Müdürü olmak', 'Bölge Müdürü olmak']
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'mehmet.kaya@company.com');

INSERT INTO employees (name, email, position, title, department, hire_date, manager_id, team_size, reporting_level, phone, salary, skills, performance_score, attendance_rate, leave_balance, career_goals) 
SELECT 'Fatma Özkan', 'fatma.ozkan@company.com', 'İnsan Kaynakları Uzmanı', 'Uzman', 'İK', '2022-09-05'::DATE, NULL, 0, 1, '+90 555 456 7890', 13000.00, ARRAY['İK Yönetimi', 'İşe Alım', 'Performans Değerlendirme'], 8.9, 96.8, 18, ARRAY['İK Müdürü olmak', 'Organizasyonel Gelişim Uzmanı olmak']
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'fatma.ozkan@company.com');

INSERT INTO employees (name, email, position, title, department, hire_date, manager_id, team_size, reporting_level, phone, salary, skills, performance_score, attendance_rate, leave_balance, career_goals) 
SELECT 'Ali Çelik', 'ali.celik@company.com', 'Sistem Yöneticisi', 'Uzman', 'Teknoloji', '2021-12-01'::DATE, NULL, 0, 1, '+90 555 567 8901', 16000.00, ARRAY['Linux', 'Docker', 'AWS'], 9.5, 94.3, 22, ARRAY['DevOps Mühendisi olmak', 'Teknoloji Müdürü olmak']
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'ali.celik@company.com');

-- Daha fazla örnek veri ekle (hiyerarşik yapı için)
INSERT INTO employees (name, email, position, title, department, hire_date, manager_id, team_size, reporting_level, phone, salary, skills, performance_score, attendance_rate, leave_balance, career_goals) 
SELECT 'Zeynep Korkmaz', 'zeynep.korkmaz@company.com', 'Yazılım Geliştirici', 'Stajyer', 'Teknoloji', '2024-06-01'::DATE, (SELECT id FROM employees WHERE email = 'ahmet.yilmaz@company.com' LIMIT 1), 0, 2, '+90 555 111 1111', 8000.00, ARRAY['JavaScript', 'HTML', 'CSS'], 6.5, 90.0, 20, ARRAY['Junior Developer olmak', 'React öğrenmek']
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'zeynep.korkmaz@company.com');

INSERT INTO employees (name, email, position, title, department, hire_date, manager_id, team_size, reporting_level, phone, salary, skills, performance_score, attendance_rate, leave_balance, career_goals) 
SELECT 'Can Özkan', 'can.ozkan@company.com', 'Yazılım Geliştirici', 'Junior', 'Teknoloji', '2023-09-01'::DATE, (SELECT id FROM employees WHERE email = 'ahmet.yilmaz@company.com' LIMIT 1), 0, 2, '+90 555 222 2222', 10000.00, ARRAY['JavaScript', 'React', 'Git'], 7.2, 92.5, 18, ARRAY['Mid-level Developer olmak', 'Backend geliştirme']
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'can.ozkan@company.com');

INSERT INTO employees (name, email, position, title, department, hire_date, manager_id, team_size, reporting_level, phone, salary, skills, performance_score, attendance_rate, leave_balance, career_goals) 
SELECT 'Elif Yıldız', 'elif.yildiz@company.com', 'Müşteri Temsilcisi', 'Stajyer', 'Müşteri Hizmetleri', '2024-07-01'::DATE, (SELECT id FROM employees WHERE email = 'ayse.demir@company.com' LIMIT 1), 0, 2, '+90 555 333 3333', 7000.00, ARRAY['İletişim', 'CRM'], 6.8, 88.5, 20, ARRAY['Uzman olmak', 'İngilizce geliştirmek']
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'elif.yildiz@company.com');

INSERT INTO employees (name, email, position, title, department, hire_date, manager_id, team_size, reporting_level, phone, salary, skills, performance_score, attendance_rate, leave_balance, career_goals) 
SELECT 'Burak Demir', 'burak.demir@company.com', 'Satış Temsilcisi', 'Junior', 'Satış', '2023-11-01'::DATE, (SELECT id FROM employees WHERE email = 'mehmet.kaya@company.com' LIMIT 1), 0, 2, '+90 555 444 4444', 9000.00, ARRAY['Satış', 'Müzakere'], 7.5, 94.0, 16, ARRAY['Uzman olmak', 'Ekip lideri olmak']
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'burak.demir@company.com');

INSERT INTO employees (name, email, position, title, department, hire_date, manager_id, team_size, reporting_level, phone, salary, skills, performance_score, attendance_rate, leave_balance, career_goals) 
SELECT 'Selin Arslan', 'selin.arslan@company.com', 'İK Uzmanı', 'Junior', 'İK', '2023-08-01'::DATE, (SELECT id FROM employees WHERE email = 'fatma.ozkan@company.com' LIMIT 1), 0, 2, '+90 555 555 5555', 8500.00, ARRAY['İK', 'İşe Alım'], 7.8, 96.0, 17, ARRAY['Uzman olmak', 'Organizasyonel gelişim']
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'selin.arslan@company.com');

INSERT INTO employees (name, email, position, title, department, hire_date, manager_id, team_size, reporting_level, phone, salary, skills, performance_score, attendance_rate, leave_balance, career_goals) 
SELECT 'Emre Şahin', 'emre.sahin@company.com', 'DevOps Mühendisi', 'Senior', 'Teknoloji', '2022-03-01'::DATE, (SELECT id FROM employees WHERE email = 'ali.celik@company.com' LIMIT 1), 0, 2, '+90 555 666 6666', 18000.00, ARRAY['Docker', 'Kubernetes', 'AWS'], 8.8, 95.5, 14, ARRAY['Lead DevOps olmak', 'Cloud Architecture']
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'emre.sahin@company.com');

INSERT INTO employees (name, email, position, title, department, hire_date, manager_id, team_size, reporting_level, phone, salary, skills, performance_score, attendance_rate, leave_balance, career_goals) 
SELECT 'Deniz Yılmaz', 'deniz.yilmaz@company.com', 'Teknoloji Müdürü', 'Müdür', 'Teknoloji', '2020-01-15'::DATE, NULL, 8, 1, '+90 555 777 7777', 25000.00, ARRAY['Liderlik', 'Strateji', 'Teknoloji Yönetimi'], 9.2, 98.0, 10, ARRAY['CTO olmak', 'Dijital dönüşüm']
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'deniz.yilmaz@company.com');

INSERT INTO employees (name, email, position, title, department, hire_date, manager_id, team_size, reporting_level, phone, salary, skills, performance_score, attendance_rate, leave_balance, career_goals) 
SELECT 'Merve Kaya', 'merve.kaya@company.com', 'Müşteri Hizmetleri Müdürü', 'Müdür', 'Müşteri Hizmetleri', '2019-06-01'::DATE, NULL, 12, 1, '+90 555 888 8888', 22000.00, ARRAY['Liderlik', 'Müşteri Deneyimi', 'Operasyon'], 8.9, 97.5, 8, ARRAY['Operasyon Müdürü olmak', 'Müşteri başarısı']
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'merve.kaya@company.com');

INSERT INTO employees (name, email, position, title, department, hire_date, manager_id, team_size, reporting_level, phone, salary, skills, performance_score, attendance_rate, leave_balance, career_goals) 
SELECT 'Kemal Özkan', 'kemal.ozkan@company.com', 'Satış Müdürü', 'Müdür', 'Satış', '2018-09-01'::DATE, NULL, 15, 1, '+90 555 999 9999', 24000.00, ARRAY['Liderlik', 'Satış Stratejisi', 'Pazar Analizi'], 9.5, 96.0, 6, ARRAY['Satış Direktörü olmak', 'Bölge genişletme']
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'kemal.ozkan@company.com');

INSERT INTO employees (name, email, position, title, department, hire_date, manager_id, team_size, reporting_level, phone, salary, skills, performance_score, attendance_rate, leave_balance, career_goals) 
SELECT 'Aylin Demir', 'aylin.demir@company.com', 'İK Müdürü', 'Müdür', 'İK', '2019-03-01'::DATE, NULL, 6, 1, '+90 555 000 0000', 20000.00, ARRAY['Liderlik', 'İK Stratejisi', 'Organizasyonel Gelişim'], 9.0, 98.5, 12, ARRAY['İK Direktörü olmak', 'Kültür dönüşümü']
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'aylin.demir@company.com');

INSERT INTO employees (name, email, position, title, department, hire_date, manager_id, team_size, reporting_level, phone, salary, skills, performance_score, attendance_rate, leave_balance, career_goals) 
SELECT 'Murat Yıldız', 'murat.yildiz@company.com', 'Bölge Müdürü', 'Bölge Müdürü', 'Genel Yönetim', '2017-01-01'::DATE, NULL, 45, 1, '+90 555 123 0000', 35000.00, ARRAY['Strateji', 'Liderlik', 'Finansal Yönetim'], 9.8, 99.0, 5, ARRAY['Genel Müdür olmak', 'Şirket büyütme']
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'murat.yildiz@company.com');

-- Ekip büyüklüklerini güncelle
UPDATE employees SET team_size = 2 WHERE email = 'ahmet.yilmaz@company.com';
UPDATE employees SET team_size = 1 WHERE email = 'ayse.demir@company.com';
UPDATE employees SET team_size = 1 WHERE email = 'mehmet.kaya@company.com';
UPDATE employees SET team_size = 1 WHERE email = 'fatma.ozkan@company.com';
UPDATE employees SET team_size = 1 WHERE email = 'ali.celik@company.com';
UPDATE employees SET team_size = 3 WHERE email = 'deniz.yilmaz@company.com';
UPDATE employees SET team_size = 2 WHERE email = 'merve.kaya@company.com';
UPDATE employees SET team_size = 2 WHERE email = 'kemal.ozkan@company.com';
UPDATE employees SET team_size = 1 WHERE email = 'aylin.demir@company.com';
UPDATE employees SET team_size = 5 WHERE email = 'murat.yildiz@company.com';

INSERT INTO skills (name, category, level, employees) 
SELECT 'JavaScript', 'Programlama', 'advanced', ARRAY[]::uuid[]
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'JavaScript');

INSERT INTO skills (name, category, level, employees) 
SELECT 'React', 'Frontend', 'expert', ARRAY[]::uuid[]
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'React');

INSERT INTO skills (name, category, level, employees) 
SELECT 'Node.js', 'Backend', 'intermediate', ARRAY[]::uuid[]
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Node.js');

INSERT INTO skills (name, category, level, employees) 
SELECT 'Python', 'Programlama', 'beginner', ARRAY[]::uuid[]
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Python');

INSERT INTO skills (name, category, level, employees) 
SELECT 'Docker', 'DevOps', 'advanced', ARRAY[]::uuid[]
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Docker');

INSERT INTO skills (name, category, level, employees) 
SELECT 'AWS', 'Cloud', 'intermediate', ARRAY[]::uuid[]
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'AWS');

INSERT INTO skills (name, category, level, employees) 
SELECT 'Müşteri İlişkileri', 'Soft Skills', 'expert', ARRAY[]::uuid[]
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Müşteri İlişkileri');

INSERT INTO skills (name, category, level, employees) 
SELECT 'Satış Teknikleri', 'Satış', 'advanced', ARRAY[]::uuid[]
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Satış Teknikleri');

INSERT INTO skills (name, category, level, employees) 
SELECT 'İK Yönetimi', 'İnsan Kaynakları', 'expert', ARRAY[]::uuid[]
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'İK Yönetimi');

INSERT INTO skills (name, category, level, employees) 
SELECT 'Linux', 'Sistem Yönetimi', 'advanced', ARRAY[]::uuid[]
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Linux');

-- Performans değerlendirmeleri ekle (sadece mevcut olmayan veriler)
INSERT INTO performance_reviews (employee_id, reviewer_id, score, feedback, goals, review_date, next_review_date) 
SELECT * FROM (VALUES
  ((SELECT id FROM employees WHERE email = 'ahmet.yilmaz@company.com' LIMIT 1), gen_random_uuid(), 8.5, 'Mükemmel kod kalitesi ve takım çalışması. React konusunda uzmanlaşmaya devam etmeli.', ARRAY['React Native öğrenmek', 'Mentorluk yapmak'], '2024-01-15'::DATE, '2024-07-15'::DATE),
  ((SELECT id FROM employees WHERE email = 'ayse.demir@company.com' LIMIT 1), gen_random_uuid(), 7.8, 'Müşteri memnuniyeti yüksek. İletişim becerileri geliştirilmeli.', ARRAY['İngilizce geliştirmek', 'Liderlik becerileri'], '2024-01-20'::DATE, '2024-07-20'::DATE),
  ((SELECT id FROM employees WHERE email = 'mehmet.kaya@company.com' LIMIT 1), gen_random_uuid(), 9.2, 'Hedeflerini aşan performans. Satış teknikleri mükemmel.', ARRAY['Yeni pazarlar açmak', 'Ekip liderliği'], '2024-01-25'::DATE, '2024-07-25'::DATE)
) AS v(employee_id, reviewer_id, score, feedback, goals, review_date, next_review_date)
WHERE v.employee_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM performance_reviews pr 
    WHERE pr.employee_id = v.employee_id 
    AND pr.review_date = v.review_date
  );

-- İzin talepleri ekle (sadece mevcut olmayan veriler)
INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status) 
SELECT * FROM (VALUES
  ((SELECT id FROM employees WHERE email = 'ahmet.yilmaz@company.com' LIMIT 1), 'annual', '2024-07-01'::DATE, '2024-07-05'::DATE, 'Yaz tatili', 'pending'),
  ((SELECT id FROM employees WHERE email = 'ayse.demir@company.com' LIMIT 1), 'sick', '2024-01-10'::DATE, '2024-01-12'::DATE, 'Grip', 'approved'),
  ((SELECT id FROM employees WHERE email = 'mehmet.kaya@company.com' LIMIT 1), 'personal', '2024-02-15'::DATE, '2024-02-16'::DATE, 'Kişisel işler', 'approved')
) AS v(employee_id, leave_type, start_date, end_date, reason, status)
WHERE v.employee_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM leave_requests lr 
    WHERE lr.employee_id = v.employee_id 
    AND lr.start_date = v.start_date 
    AND lr.leave_type = v.leave_type
  );

-- Yeterlilik değerlendirmeleri ekle
INSERT INTO competency_assessments (employee_id, skill_id, assessor_id, current_level, target_level, assessment_date, notes, next_assessment_date)
SELECT * FROM (VALUES
  ((SELECT id FROM employees WHERE email = 'ahmet.yilmaz@company.com' LIMIT 1), (SELECT id FROM skills WHERE name = 'React' LIMIT 1), gen_random_uuid(), 'advanced', 'expert', '2024-01-15'::DATE, 'React konusunda çok iyi seviyede. Expert seviyeye ulaşmak için daha fazla proje deneyimi gerekli.', '2024-07-15'::DATE),
  ((SELECT id FROM employees WHERE email = 'ayse.demir@company.com' LIMIT 1), (SELECT id FROM skills WHERE name = 'Müşteri İlişkileri' LIMIT 1), gen_random_uuid(), 'expert', 'expert', '2024-01-20'::DATE, 'Müşteri ilişkileri konusunda uzman seviyede. Mentorluk yapabilir.', '2024-07-20'::DATE),
  ((SELECT id FROM employees WHERE email = 'mehmet.kaya@company.com' LIMIT 1), (SELECT id FROM skills WHERE name = 'Satış Teknikleri' LIMIT 1), gen_random_uuid(), 'advanced', 'expert', '2024-01-25'::DATE, 'Satış teknikleri konusunda çok başarılı. Expert seviyeye ulaşmak için ekip liderliği deneyimi gerekli.', '2024-07-25'::DATE)
) AS v(employee_id, skill_id, assessor_id, current_level, target_level, assessment_date, notes, next_assessment_date)
WHERE v.employee_id IS NOT NULL AND v.skill_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM competency_assessments ca 
    WHERE ca.employee_id = v.employee_id 
    AND ca.skill_id = v.skill_id 
    AND ca.assessment_date = v.assessment_date
  );

-- Kariyer gelişim planları ekle
INSERT INTO career_development_plans (employee_id, mentor_id, current_position, target_position, timeline_months, required_skills, action_items, progress_percentage, status, start_date, target_completion_date)
SELECT * FROM (VALUES
  ((SELECT id FROM employees WHERE email = 'ahmet.yilmaz@company.com' LIMIT 1), gen_random_uuid(), 'Yazılım Geliştirici', 'Senior Developer', 12, ARRAY['React Native', 'TypeScript', 'Mentorluk'], ARRAY['React Native kursu tamamla', 'TypeScript projeleri geliştir', 'Junior developerlara mentorluk yap'], 45.0, 'active', '2024-01-01'::DATE, '2024-12-31'::DATE),
  ((SELECT id FROM employees WHERE email = 'ayse.demir@company.com' LIMIT 1), gen_random_uuid(), 'Müşteri Temsilcisi', 'Müşteri Hizmetleri Müdürü', 18, ARRAY['Liderlik', 'Proje Yönetimi', 'İngilizce'], ARRAY['Liderlik eğitimi al', 'PMP sertifikası al', 'İngilizce kursu tamamla'], 30.0, 'active', '2024-01-01'::DATE, '2025-06-30'::DATE),
  ((SELECT id FROM employees WHERE email = 'mehmet.kaya@company.com' LIMIT 1), gen_random_uuid(), 'Satış Temsilcisi', 'Satış Müdürü', 15, ARRAY['Ekip Yönetimi', 'Stratejik Planlama', 'Analiz'], ARRAY['Ekip yönetimi eğitimi al', 'Satış stratejileri geliştir', 'Pazar analizi yap'], 60.0, 'active', '2024-01-01'::DATE, '2025-03-31'::DATE)
) AS v(employee_id, mentor_id, current_position, target_position, timeline_months, required_skills, action_items, progress_percentage, status, start_date, target_completion_date)
WHERE v.employee_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM career_development_plans cdp 
    WHERE cdp.employee_id = v.employee_id 
    AND cdp.target_position = v.target_position
  );

-- Verimlilik metrikleri ekle
INSERT INTO productivity_metrics (employee_id, metric_date, tasks_completed, tasks_assigned, hours_worked, quality_score, efficiency_score, collaboration_score, notes)
SELECT * FROM (VALUES
  ((SELECT id FROM employees WHERE email = 'ahmet.yilmaz@company.com' LIMIT 1), '2024-01-15'::DATE, 12, 15, 40.5, 9.2, 8.8, 9.0, 'Haftalık performans çok iyi'),
  ((SELECT id FROM employees WHERE email = 'ayse.demir@company.com' LIMIT 1), '2024-01-15'::DATE, 25, 28, 42.0, 8.5, 8.9, 9.5, 'Müşteri memnuniyeti yüksek'),
  ((SELECT id FROM employees WHERE email = 'mehmet.kaya@company.com' LIMIT 1), '2024-01-15'::DATE, 8, 10, 38.5, 9.5, 9.2, 8.7, 'Satış hedeflerini aştı'),
  ((SELECT id FROM employees WHERE email = 'fatma.ozkan@company.com' LIMIT 1), '2024-01-15'::DATE, 15, 18, 41.0, 8.8, 8.5, 9.1, 'İK süreçleri başarıyla yönetildi'),
  ((SELECT id FROM employees WHERE email = 'ali.celik@company.com' LIMIT 1), '2024-01-15'::DATE, 20, 22, 43.5, 9.0, 9.3, 8.9, 'Sistem güvenliği ve performansı optimal')
) AS v(employee_id, metric_date, tasks_completed, tasks_assigned, hours_worked, quality_score, efficiency_score, collaboration_score, notes)
WHERE v.employee_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM productivity_metrics pm 
    WHERE pm.employee_id = v.employee_id 
    AND pm.metric_date = v.metric_date
  );

-- Gelişim aktiviteleri ekle
INSERT INTO development_activities (employee_id, activity_type, title, description, start_date, end_date, status, completion_percentage, skills_developed)
SELECT * FROM (VALUES
  ((SELECT id FROM employees WHERE email = 'ahmet.yilmaz@company.com' LIMIT 1), 'training', 'React Native Eğitimi', 'Mobil uygulama geliştirme eğitimi', '2024-02-01'::DATE, '2024-04-30'::DATE, 'in_progress', 60.0, ARRAY['React Native', 'Mobile Development']),
  ((SELECT id FROM employees WHERE email = 'ayse.demir@company.com' LIMIT 1), 'certification', 'PMP Sertifikası', 'Proje Yönetimi Profesyonel sertifikası', '2024-01-15'::DATE, '2024-06-30'::DATE, 'planned', 0.0, ARRAY['Project Management', 'Leadership']),
  ((SELECT id FROM employees WHERE email = 'mehmet.kaya@company.com' LIMIT 1), 'mentoring', 'Satış Mentorluğu', 'Junior satış temsilcilerine mentorluk', '2024-01-01'::DATE, '2024-12-31'::DATE, 'in_progress', 75.0, ARRAY['Leadership', 'Sales Training']),
  ((SELECT id FROM employees WHERE email = 'fatma.ozkan@company.com' LIMIT 1), 'workshop', 'İK Teknolojileri Workshop', 'Modern İK teknolojileri ve araçları', '2024-03-01'::DATE, '2024-03-02'::DATE, 'planned', 0.0, ARRAY['HR Technology', 'Digital HR']),
  ((SELECT id FROM employees WHERE email = 'ali.celik@company.com' LIMIT 1), 'project', 'DevOps Dönüşüm Projesi', 'Şirket genelinde DevOps kültürü yaygınlaştırma', '2024-01-01'::DATE, '2024-12-31'::DATE, 'in_progress', 40.0, ARRAY['DevOps', 'Change Management'])
) AS v(employee_id, activity_type, title, description, start_date, end_date, status, completion_percentage, skills_developed)
WHERE v.employee_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM development_activities da 
    WHERE da.employee_id = v.employee_id 
    AND da.title = v.title
  );

-- İzin takip detayları ekle
INSERT INTO leave_tracking (employee_id, leave_type, year, total_allocated, total_used, total_remaining, notes)
SELECT * FROM (VALUES
  ((SELECT id FROM employees WHERE email = 'ahmet.yilmaz@company.com' LIMIT 1), 'annual', 2024, 20, 5, 15, 'Yıllık izin kullanımı normal'),
  ((SELECT id FROM employees WHERE email = 'ayse.demir@company.com' LIMIT 1), 'annual', 2024, 20, 8, 12, 'Yıllık izin kullanımı normal'),
  ((SELECT id FROM employees WHERE email = 'mehmet.kaya@company.com' LIMIT 1), 'annual', 2024, 20, 12, 8, 'Yıllık izin kullanımı yüksek'),
  ((SELECT id FROM employees WHERE email = 'fatma.ozkan@company.com' LIMIT 1), 'annual', 2024, 20, 2, 18, 'Yıllık izin kullanımı düşük'),
  ((SELECT id FROM employees WHERE email = 'ali.celik@company.com' LIMIT 1), 'annual', 2024, 20, 0, 20, 'Henüz yıllık izin kullanılmamış')
) AS v(employee_id, leave_type, year, total_allocated, total_used, total_remaining, notes)
WHERE v.employee_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM leave_tracking lt 
    WHERE lt.employee_id = v.employee_id 
    AND lt.leave_type = v.leave_type 
    AND lt.year = v.year
  );

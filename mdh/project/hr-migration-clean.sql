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
INSERT INTO employees (name, email, position, department, hire_date, skills, performance_score, attendance_rate, leave_balance, career_goals) 
SELECT * FROM (VALUES
  ('Ahmet Yılmaz', 'ahmet.yilmaz@company.com', 'Yazılım Geliştirici', 'Teknoloji', '2023-01-15'::DATE, ARRAY['JavaScript', 'React', 'Node.js'], 8.5, 95.2, 15, ARRAY['Senior Developer olmak', 'Team Lead pozisyonuna yükselmek']),
  ('Ayşe Demir', 'ayse.demir@company.com', 'Müşteri Temsilcisi', 'Müşteri Hizmetleri', '2022-06-20'::DATE, ARRAY['Müşteri İlişkileri', 'CRM', 'İletişim'], 7.8, 98.1, 12, ARRAY['Müşteri Hizmetleri Müdürü olmak', 'Eğitmen olmak']),
  ('Mehmet Kaya', 'mehmet.kaya@company.com', 'Satış Temsilcisi', 'Satış', '2023-03-10'::DATE, ARRAY['Satış Teknikleri', 'Pazarlama', 'Müzakere'], 9.2, 92.5, 8, ARRAY['Satış Müdürü olmak', 'Bölge Müdürü olmak']),
  ('Fatma Özkan', 'fatma.ozkan@company.com', 'İnsan Kaynakları Uzmanı', 'İK', '2022-09-05'::DATE, ARRAY['İK Yönetimi', 'İşe Alım', 'Performans Değerlendirme'], 8.9, 96.8, 18, ARRAY['İK Müdürü olmak', 'Organizasyonel Gelişim Uzmanı olmak']),
  ('Ali Çelik', 'ali.celik@company.com', 'Sistem Yöneticisi', 'Teknoloji', '2021-12-01'::DATE, ARRAY['Linux', 'Docker', 'AWS'], 9.5, 94.3, 22, ARRAY['DevOps Mühendisi olmak', 'Teknoloji Müdürü olmak'])
) AS v(name, email, position, department, hire_date, skills, performance_score, attendance_rate, leave_balance, career_goals)
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE employees.email = v.email);

INSERT INTO skills (name, category, level, employees) 
SELECT * FROM (VALUES
  ('JavaScript', 'Programlama', 'advanced', ARRAY[]::uuid[]),
  ('React', 'Frontend', 'expert', ARRAY[]::uuid[]),
  ('Node.js', 'Backend', 'intermediate', ARRAY[]::uuid[]),
  ('Python', 'Programlama', 'beginner', ARRAY[]::uuid[]),
  ('Docker', 'DevOps', 'advanced', ARRAY[]::uuid[]),
  ('AWS', 'Cloud', 'intermediate', ARRAY[]::uuid[]),
  ('Müşteri İlişkileri', 'Soft Skills', 'expert', ARRAY[]::uuid[]),
  ('Satış Teknikleri', 'Satış', 'advanced', ARRAY[]::uuid[]),
  ('İK Yönetimi', 'İnsan Kaynakları', 'expert', ARRAY[]::uuid[]),
  ('Linux', 'Sistem Yönetimi', 'advanced', ARRAY[]::uuid[])
) AS v(name, category, level, employees)
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE skills.name = v.name);

-- Performans değerlendirmeleri ekle (sadece mevcut olmayan veriler)
INSERT INTO performance_reviews (employee_id, reviewer_id, score, feedback, goals, review_date, next_review_date) 
SELECT * FROM (VALUES
  ((SELECT id FROM employees WHERE email = 'ahmet.yilmaz@company.com'), gen_random_uuid(), 8.5, 'Mükemmel kod kalitesi ve takım çalışması. React konusunda uzmanlaşmaya devam etmeli.', ARRAY['React Native öğrenmek', 'Mentorluk yapmak'], '2024-01-15'::DATE, '2024-07-15'::DATE),
  ((SELECT id FROM employees WHERE email = 'ayse.demir@company.com'), gen_random_uuid(), 7.8, 'Müşteri memnuniyeti yüksek. İletişim becerileri geliştirilmeli.', ARRAY['İngilizce geliştirmek', 'Liderlik becerileri'], '2024-01-20'::DATE, '2024-07-20'::DATE),
  ((SELECT id FROM employees WHERE email = 'mehmet.kaya@company.com'), gen_random_uuid(), 9.2, 'Hedeflerini aşan performans. Satış teknikleri mükemmel.', ARRAY['Yeni pazarlar açmak', 'Ekip liderliği'], '2024-01-25'::DATE, '2024-07-25'::DATE)
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
  ((SELECT id FROM employees WHERE email = 'ahmet.yilmaz@company.com'), 'annual', '2024-07-01'::DATE, '2024-07-05'::DATE, 'Yaz tatili', 'pending'),
  ((SELECT id FROM employees WHERE email = 'ayse.demir@company.com'), 'sick', '2024-01-10'::DATE, '2024-01-12'::DATE, 'Grip', 'approved'),
  ((SELECT id FROM employees WHERE email = 'mehmet.kaya@company.com'), 'personal', '2024-02-15'::DATE, '2024-02-16'::DATE, 'Kişisel işler', 'approved')
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
  ((SELECT id FROM employees WHERE email = 'ahmet.yilmaz@company.com'), (SELECT id FROM skills WHERE name = 'React'), gen_random_uuid(), 'advanced', 'expert', '2024-01-15'::DATE, 'React konusunda çok iyi seviyede. Expert seviyeye ulaşmak için daha fazla proje deneyimi gerekli.', '2024-07-15'::DATE),
  ((SELECT id FROM employees WHERE email = 'ayse.demir@company.com'), (SELECT id FROM skills WHERE name = 'Müşteri İlişkileri'), gen_random_uuid(), 'expert', 'expert', '2024-01-20'::DATE, 'Müşteri ilişkileri konusunda uzman seviyede. Mentorluk yapabilir.', '2024-07-20'::DATE),
  ((SELECT id FROM employees WHERE email = 'mehmet.kaya@company.com'), (SELECT id FROM skills WHERE name = 'Satış Teknikleri'), gen_random_uuid(), 'advanced', 'expert', '2024-01-25'::DATE, 'Satış teknikleri konusunda çok başarılı. Expert seviyeye ulaşmak için ekip liderliği deneyimi gerekli.', '2024-07-25'::DATE)
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
  ((SELECT id FROM employees WHERE email = 'ahmet.yilmaz@company.com'), gen_random_uuid(), 'Yazılım Geliştirici', 'Senior Developer', 12, ARRAY['React Native', 'TypeScript', 'Mentorluk'], ARRAY['React Native kursu tamamla', 'TypeScript projeleri geliştir', 'Junior developerlara mentorluk yap'], 45.0, 'active', '2024-01-01'::DATE, '2024-12-31'::DATE),
  ((SELECT id FROM employees WHERE email = 'ayse.demir@company.com'), gen_random_uuid(), 'Müşteri Temsilcisi', 'Müşteri Hizmetleri Müdürü', 18, ARRAY['Liderlik', 'Proje Yönetimi', 'İngilizce'], ARRAY['Liderlik eğitimi al', 'PMP sertifikası al', 'İngilizce kursu tamamla'], 30.0, 'active', '2024-01-01'::DATE, '2025-06-30'::DATE),
  ((SELECT id FROM employees WHERE email = 'mehmet.kaya@company.com'), gen_random_uuid(), 'Satış Temsilcisi', 'Satış Müdürü', 15, ARRAY['Ekip Yönetimi', 'Stratejik Planlama', 'Analiz'], ARRAY['Ekip yönetimi eğitimi al', 'Satış stratejileri geliştir', 'Pazar analizi yap'], 60.0, 'active', '2024-01-01'::DATE, '2025-03-31'::DATE)
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
  ((SELECT id FROM employees WHERE email = 'ahmet.yilmaz@company.com'), '2024-01-15'::DATE, 12, 15, 40.5, 9.2, 8.8, 9.0, 'Haftalık performans çok iyi'),
  ((SELECT id FROM employees WHERE email = 'ayse.demir@company.com'), '2024-01-15'::DATE, 25, 28, 42.0, 8.5, 8.9, 9.5, 'Müşteri memnuniyeti yüksek'),
  ((SELECT id FROM employees WHERE email = 'mehmet.kaya@company.com'), '2024-01-15'::DATE, 8, 10, 38.5, 9.5, 9.2, 8.7, 'Satış hedeflerini aştı'),
  ((SELECT id FROM employees WHERE email = 'fatma.ozkan@company.com'), '2024-01-15'::DATE, 15, 18, 41.0, 8.8, 8.5, 9.1, 'İK süreçleri başarıyla yönetildi'),
  ((SELECT id FROM employees WHERE email = 'ali.celik@company.com'), '2024-01-15'::DATE, 20, 22, 43.5, 9.0, 9.3, 8.9, 'Sistem güvenliği ve performansı optimal')
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
  ((SELECT id FROM employees WHERE email = 'ahmet.yilmaz@company.com'), 'training', 'React Native Eğitimi', 'Mobil uygulama geliştirme eğitimi', '2024-02-01'::DATE, '2024-04-30'::DATE, 'in_progress', 60.0, ARRAY['React Native', 'Mobile Development']),
  ((SELECT id FROM employees WHERE email = 'ayse.demir@company.com'), 'certification', 'PMP Sertifikası', 'Proje Yönetimi Profesyonel sertifikası', '2024-01-15'::DATE, '2024-06-30'::DATE, 'planned', 0.0, ARRAY['Project Management', 'Leadership']),
  ((SELECT id FROM employees WHERE email = 'mehmet.kaya@company.com'), 'mentoring', 'Satış Mentorluğu', 'Junior satış temsilcilerine mentorluk', '2024-01-01'::DATE, '2024-12-31'::DATE, 'in_progress', 75.0, ARRAY['Leadership', 'Sales Training']),
  ((SELECT id FROM employees WHERE email = 'fatma.ozkan@company.com'), 'workshop', 'İK Teknolojileri Workshop', 'Modern İK teknolojileri ve araçları', '2024-03-01'::DATE, '2024-03-02'::DATE, 'planned', 0.0, ARRAY['HR Technology', 'Digital HR']),
  ((SELECT id FROM employees WHERE email = 'ali.celik@company.com'), 'project', 'DevOps Dönüşüm Projesi', 'Şirket genelinde DevOps kültürü yaygınlaştırma', '2024-01-01'::DATE, '2024-12-31'::DATE, 'in_progress', 40.0, ARRAY['DevOps', 'Change Management'])
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
  ((SELECT id FROM employees WHERE email = 'ahmet.yilmaz@company.com'), 'annual', 2024, 20, 5, 15, 'Yıllık izin kullanımı normal'),
  ((SELECT id FROM employees WHERE email = 'ayse.demir@company.com'), 'annual', 2024, 20, 8, 12, 'Yıllık izin kullanımı normal'),
  ((SELECT id FROM employees WHERE email = 'mehmet.kaya@company.com'), 'annual', 2024, 20, 12, 8, 'Yıllık izin kullanımı yüksek'),
  ((SELECT id FROM employees WHERE email = 'fatma.ozkan@company.com'), 'annual', 2024, 20, 2, 18, 'Yıllık izin kullanımı düşük'),
  ((SELECT id FROM employees WHERE email = 'ali.celik@company.com'), 'annual', 2024, 20, 0, 20, 'Henüz yıllık izin kullanılmamış')
) AS v(employee_id, leave_type, year, total_allocated, total_used, total_remaining, notes)
WHERE v.employee_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM leave_tracking lt 
    WHERE lt.employee_id = v.employee_id 
    AND lt.leave_type = v.leave_type 
    AND lt.year = v.year
  );

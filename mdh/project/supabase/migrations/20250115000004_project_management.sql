-- Proje yönetimi tabloları

-- Projeler tablosu
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'on_hold', 'cancelled'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'TRY',
  progress_percentage INTEGER DEFAULT 0,
  project_manager_id UUID REFERENCES auth.users(id),
  client_id UUID, -- Müşteri ID'si (customers tablosundan)
  tags JSONB, -- Proje etiketleri
  settings JSONB, -- Proje ayarları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proje üyeleri tablosu
CREATE TABLE IF NOT EXISTS project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role VARCHAR(50) DEFAULT 'member', -- 'manager', 'lead', 'member', 'viewer'
  permissions JSONB, -- Üye izinleri
  hourly_rate DECIMAL(10,2),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(project_id, user_id)
);

-- Görevler tablosu
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES project_tasks(id), -- Alt görevler için
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo', -- 'todo', 'in_progress', 'review', 'done'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  assignee_id UUID REFERENCES auth.users(id),
  reporter_id UUID REFERENCES auth.users(id),
  estimated_hours INTEGER,
  actual_hours INTEGER,
  due_date TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  tags JSONB,
  attachments JSONB, -- Ek dosyalar
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Görev yorumları tablosu
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- İç yorum mu?
  parent_comment_id UUID REFERENCES task_comments(id), -- Yanıt için
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Görev geçmişi tablosu
CREATE TABLE IF NOT EXISTS task_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL, -- Değişen alan
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Zaman takibi tablosu
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER, -- Dakika cinsinden süre
  is_billable BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proje dosyaları tablosu
CREATE TABLE IF NOT EXISTS project_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES project_tasks(id), -- Opsiyonel, göreve bağlı dosya
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(100),
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proje raporları tablosu
CREATE TABLE IF NOT EXISTS project_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  report_type VARCHAR(100) NOT NULL, -- 'progress', 'time', 'budget', 'custom'
  report_name VARCHAR(255) NOT NULL,
  report_data JSONB, -- Rapor verileri
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_path VARCHAR(500) -- Rapor dosya yolu
);

-- Proje şablonları tablosu
CREATE TABLE IF NOT EXISTS project_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name VARCHAR(255) NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL, -- Şablon verileri (görevler, üyeler vb.)
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proje etiketleri tablosu
CREATE TABLE IF NOT EXISTS project_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3b82f6', -- Hex renk kodu
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Görev etiketleri tablosu
CREATE TABLE IF NOT EXISTS task_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
  label_id UUID REFERENCES project_labels(id) ON DELETE CASCADE,
  UNIQUE(task_id, label_id)
);

-- Proje aktiviteleri tablosu
CREATE TABLE IF NOT EXISTS project_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  activity_type VARCHAR(100) NOT NULL, -- 'task_created', 'task_updated', 'comment_added' vb.
  activity_data JSONB, -- Aktivite detayları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS daha sonra ayrı bir migration'da etkinleştirilecek

-- RLS politikaları daha sonra ayrı bir migration'da eklenecek

-- Index'ler daha sonra ayrı bir migration'da eklenecek

-- Trigger'lar daha sonra ayrı bir migration'da eklenecek

-- İş akışı ve onay sistemi tabloları

-- İş akışı tanımları tablosu
CREATE TABLE IF NOT EXISTS workflow_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  workflow_type VARCHAR(100) NOT NULL, -- 'ticket_approval', 'expense_approval', 'leave_request' vb.
  steps JSONB NOT NULL, -- İş akışı adımları
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İş akışı örnekleri tablosu
CREATE TABLE IF NOT EXISTS workflow_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_definition_id UUID REFERENCES workflow_definitions(id),
  entity_type VARCHAR(100) NOT NULL, -- 'ticket', 'expense', 'leave_request' vb.
  entity_id UUID NOT NULL, -- İlgili entity'nin ID'si
  current_step INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İş akışı adımları tablosu
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_instance_id UUID REFERENCES workflow_instances(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  step_type VARCHAR(50) NOT NULL, -- 'approval', 'review', 'notification', 'action'
  assigned_user_id UUID REFERENCES auth.users(id),
  assigned_role VARCHAR(100), -- Rol bazlı atama
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'rejected', 'skipped'
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  action_taken VARCHAR(100), -- 'approved', 'rejected', 'requested_changes'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onay istekleri tablosu
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_instance_id UUID REFERENCES workflow_instances(id),
  step_id UUID REFERENCES workflow_steps(id),
  requester_id UUID REFERENCES auth.users(id),
  approver_id UUID REFERENCES auth.users(id),
  request_type VARCHAR(100) NOT NULL, -- 'ticket_approval', 'expense_approval' vb.
  entity_id UUID NOT NULL,
  entity_data JSONB, -- Onaylanacak veri
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  due_date TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  approval_comments TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onay geçmişi tablosu
CREATE TABLE IF NOT EXISTS approval_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  approval_request_id UUID REFERENCES approval_requests(id),
  action VARCHAR(50) NOT NULL, -- 'submitted', 'approved', 'rejected', 'delegated'
  actor_id UUID REFERENCES auth.users(id),
  action_comments TEXT,
  action_data JSONB, -- Aksiyon detayları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onay delegasyonları tablosu
CREATE TABLE IF NOT EXISTS approval_delegations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  delegator_id UUID REFERENCES auth.users(id),
  delegate_id UUID REFERENCES auth.users(id),
  delegation_type VARCHAR(100), -- 'temporary', 'permanent', 'specific_workflow'
  workflow_types JSONB, -- Hangi iş akışları için geçerli
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Otomatik onay kuralları tablosu
CREATE TABLE IF NOT EXISTS auto_approval_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name VARCHAR(255) NOT NULL,
  workflow_type VARCHAR(100) NOT NULL,
  conditions JSONB NOT NULL, -- Otomatik onay koşulları
  actions JSONB NOT NULL, -- Otomatik aksiyonlar
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onay şablonları tablosu
CREATE TABLE IF NOT EXISTS approval_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name VARCHAR(255) NOT NULL,
  template_type VARCHAR(100) NOT NULL,
  subject_template TEXT,
  body_template TEXT,
  variables JSONB, -- Şablon değişkenleri
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onay bildirimleri tablosu
CREATE TABLE IF NOT EXISTS approval_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  approval_request_id UUID REFERENCES approval_requests(id),
  recipient_id UUID REFERENCES auth.users(id),
  notification_type VARCHAR(50), -- 'email', 'push', 'in_app'
  subject VARCHAR(255),
  message TEXT,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS daha sonra ayrı bir migration'da etkinleştirilecek

-- RLS politikaları daha sonra ayrı bir migration'da eklenecek

-- Index'ler daha sonra ayrı bir migration'da eklenecek

-- Trigger'lar daha sonra ayrı bir migration'da eklenecek

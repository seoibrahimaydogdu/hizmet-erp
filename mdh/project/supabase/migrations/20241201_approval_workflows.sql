-- Approval Workflows Sistemi
-- Migration: 20241201_approval_workflows.sql

-- Onay süreçleri tablosu
CREATE TABLE IF NOT EXISTS approval_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  workflow_type text NOT NULL DEFAULT 'sequential', -- 'sequential', 'parallel', 'conditional'
  status text DEFAULT 'active', -- 'active', 'inactive', 'archived'
  version integer DEFAULT 1,
  workflow_config jsonb NOT NULL DEFAULT '{}', -- Onay süreci yapılandırması
  trigger_conditions jsonb DEFAULT '{}', -- Tetikleme koşulları
  auto_approve_timeout integer DEFAULT 0, -- Otomatik onay süresi (saat)
  require_all_approvers boolean DEFAULT false, -- Tüm onaylayıcılar gerekli mi?
  allow_delegate boolean DEFAULT true, -- Vekalet verme izni
  max_delegation_level integer DEFAULT 1, -- Maksimum vekalet seviyesi
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Onay süreci adımları
CREATE TABLE IF NOT EXISTS approval_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_workflow_id uuid REFERENCES approval_workflows(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  step_name text NOT NULL,
  step_type text NOT NULL DEFAULT 'approval', -- 'approval', 'review', 'signature'
  approver_type text NOT NULL DEFAULT 'user', -- 'user', 'role', 'group', 'dynamic'
  approver_config jsonb NOT NULL DEFAULT '{}', -- Onaylayıcı konfigürasyonu
  conditions jsonb DEFAULT '{}', -- Koşullu onay adımları
  timeout_hours integer DEFAULT 24, -- Adım timeout süresi
  is_required boolean DEFAULT true, -- Zorunlu adım mı?
  can_skip boolean DEFAULT false, -- Atlanabilir mi?
  created_at timestamptz DEFAULT now()
);

-- Onay talepleri
CREATE TABLE IF NOT EXISTS approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_workflow_id uuid REFERENCES approval_workflows(id) ON DELETE CASCADE,
  request_type text NOT NULL, -- 'ticket', 'expense', 'purchase', 'custom'
  request_data jsonb NOT NULL DEFAULT '{}', -- Talep verileri
  requester_id uuid NOT NULL,
  current_step_id uuid REFERENCES approval_steps(id),
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled', 'expired'
  priority text DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  due_date timestamptz,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  total_steps integer DEFAULT 0,
  completed_steps integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Onay adım durumları
CREATE TABLE IF NOT EXISTS approval_step_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_request_id uuid REFERENCES approval_requests(id) ON DELETE CASCADE,
  step_id uuid REFERENCES approval_steps(id) ON DELETE CASCADE,
  approver_id uuid,
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'delegated', 'skipped'
  decision text, -- Onay/red nedeni
  decision_date timestamptz,
  delegated_to uuid, -- Vekalet verilen kişi
  delegation_reason text,
  comments text,
  attachments jsonb DEFAULT '[]', -- Ekler
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Onay geçmişi
CREATE TABLE IF NOT EXISTS approval_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_request_id uuid REFERENCES approval_requests(id) ON DELETE CASCADE,
  step_id uuid REFERENCES approval_steps(id),
  action text NOT NULL, -- 'created', 'approved', 'rejected', 'delegated', 'skipped', 'expired'
  actor_id uuid,
  actor_type text DEFAULT 'user', -- 'user', 'system', 'delegate'
  action_data jsonb DEFAULT '{}', -- Aksiyon detayları
  timestamp timestamptz DEFAULT now()
);

-- Onay şablonları
CREATE TABLE IF NOT EXISTS approval_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL, -- 'expense', 'purchase', 'hr', 'general'
  template_config jsonb NOT NULL DEFAULT '{}', -- Şablon yapılandırması
  is_public boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Onay bildirimleri
CREATE TABLE IF NOT EXISTS approval_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_request_id uuid REFERENCES approval_requests(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL,
  notification_type text NOT NULL, -- 'pending_approval', 'approved', 'rejected', 'delegated', 'reminder'
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  sent_at timestamptz DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_approval_workflows_status ON approval_workflows(status);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_type ON approval_workflows(workflow_type);
CREATE INDEX IF NOT EXISTS idx_approval_steps_workflow_id ON approval_steps(approval_workflow_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_order ON approval_steps(step_order);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_type ON approval_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requester ON approval_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_approval_step_status_request_id ON approval_step_status(approval_request_id);
CREATE INDEX IF NOT EXISTS idx_approval_step_status_approver ON approval_step_status(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_request_id ON approval_history(approval_request_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_timestamp ON approval_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_approval_templates_category ON approval_templates(category);
CREATE INDEX IF NOT EXISTS idx_approval_notifications_recipient ON approval_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_approval_notifications_read ON approval_notifications(is_read);

-- Trigger'lar
CREATE OR REPLACE FUNCTION update_approval_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_approval_workflow_updated_at
  BEFORE UPDATE ON approval_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_approval_workflow_updated_at();

CREATE TRIGGER trigger_update_approval_request_updated_at
  BEFORE UPDATE ON approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_approval_workflow_updated_at();

CREATE TRIGGER trigger_update_approval_step_status_updated_at
  BEFORE UPDATE ON approval_step_status
  FOR EACH ROW
  EXECUTE FUNCTION update_approval_workflow_updated_at();

CREATE TRIGGER trigger_update_approval_template_updated_at
  BEFORE UPDATE ON approval_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_approval_workflow_updated_at();

-- Varsayılan onay şablonları
INSERT INTO approval_templates (name, description, category, template_config, is_public) VALUES
('Masraf Onayı', 'Masraf raporları için standart onay süreci', 'expense', '{"steps": [{"step_order": 1, "step_name": "Yönetici Onayı", "approver_type": "role", "approver_config": {"role": "manager"}}, {"step_order": 2, "step_name": "Finans Onayı", "approver_type": "role", "approver_config": {"role": "finance"}}]}', true),
('Satın Alma Onayı', 'Satın alma talepleri için onay süreci', 'purchase', '{"steps": [{"step_order": 1, "step_name": "Departman Onayı", "approver_type": "role", "approver_config": {"role": "department_head"}}, {"step_order": 2, "step_name": "Satın Alma Onayı", "approver_type": "role", "approver_config": {"role": "procurement"}}]}', true),
('İK Onayı', 'İK süreçleri için onay', 'hr', '{"steps": [{"step_order": 1, "step_name": "İK Onayı", "approver_type": "role", "approver_config": {"role": "hr_manager"}}]}', true),
('Genel Onay', 'Genel kullanım için basit onay süreci', 'general', '{"steps": [{"step_order": 1, "step_name": "Yönetici Onayı", "approver_type": "user", "approver_config": {"approver_id": "dynamic"}}]}', true)
ON CONFLICT DO NOTHING;

-- Varsayılan onay süreçleri
INSERT INTO approval_workflows (name, description, workflow_type, workflow_config, trigger_conditions) VALUES
('Masraf Onay Süreci', 'Masraf raporları için otomatik onay süreci', 'sequential', '{"auto_approve_timeout": 48, "require_all_approvers": false, "allow_delegate": true}', '{"request_type": "expense", "amount_threshold": 1000}'),
('Satın Alma Onay Süreci', 'Satın alma talepleri için onay süreci', 'conditional', '{"auto_approve_timeout": 72, "require_all_approvers": true, "allow_delegate": false}', '{"request_type": "purchase", "amount_threshold": 5000}'),
('İzin Onay Süreci', 'İzin talepleri için onay süreci', 'sequential', '{"auto_approve_timeout": 24, "require_all_approvers": false, "allow_delegate": true}', '{"request_type": "leave", "duration_threshold": 3}')
ON CONFLICT DO NOTHING;

-- RLS politikaları (geliştirme aşamasında devre dışı)
-- ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE approval_steps ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE approval_step_status ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE approval_templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE approval_notifications ENABLE ROW LEVEL SECURITY;

-- RLS politikaları (yorum satırlarında hazır)
/*
-- Approval workflows için RLS
CREATE POLICY "Users can view approval workflows" ON approval_workflows
  FOR SELECT USING (status = 'active' OR created_by = auth.uid());

CREATE POLICY "Users can create approval workflows" ON approval_workflows
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own workflows" ON approval_workflows
  FOR UPDATE USING (created_by = auth.uid());

-- Approval requests için RLS
CREATE POLICY "Users can view their own requests" ON approval_requests
  FOR SELECT USING (requester_id = auth.uid() OR id IN (
    SELECT approval_request_id FROM approval_step_status WHERE approver_id = auth.uid()
  ));

CREATE POLICY "Users can create approval requests" ON approval_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

-- Approval step status için RLS
CREATE POLICY "Users can view their approval tasks" ON approval_step_status
  FOR SELECT USING (approver_id = auth.uid() OR delegated_to = auth.uid());

CREATE POLICY "Users can update their approval decisions" ON approval_step_status
  FOR UPDATE USING (approver_id = auth.uid() OR delegated_to = auth.uid());
*/

-- Workflow Builder Sistemi
-- Migration: 20241201_workflow_builder.sql

-- Workflow'lar tablosu
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'ticket', -- 'ticket', 'approval', 'notification', 'custom'
  status text DEFAULT 'draft', -- 'draft', 'active', 'inactive', 'archived'
  version integer DEFAULT 1,
  workflow_data jsonb NOT NULL DEFAULT '{}', -- Workflow yapısı (nodes, connections)
  trigger_config jsonb NOT NULL DEFAULT '{}', -- Tetikleyici ayarları
  variables jsonb DEFAULT '{}', -- Workflow değişkenleri
  execution_count integer DEFAULT 0,
  last_executed timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Workflow çalıştırma geçmişi
CREATE TABLE IF NOT EXISTS workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  trigger_data jsonb NOT NULL DEFAULT '{}', -- Tetikleyici verileri
  execution_path jsonb NOT NULL DEFAULT '[]', -- Çalıştırma yolu
  status text DEFAULT 'running', -- 'running', 'completed', 'failed', 'paused'
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  error_message text,
  variables jsonb DEFAULT '{}', -- Çalışma zamanı değişkenleri
  created_at timestamptz DEFAULT now()
);

-- Workflow şablonları
CREATE TABLE IF NOT EXISTS workflow_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  template_data jsonb NOT NULL DEFAULT '{}', -- Şablon yapısı
  usage_count integer DEFAULT 0,
  is_public boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Workflow node tipleri
CREATE TABLE IF NOT EXISTS workflow_node_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL UNIQUE, -- 'trigger', 'condition', 'action', 'approval', 'notification', 'assignment'
  icon text,
  description text,
  config_schema jsonb NOT NULL DEFAULT '{}', -- Konfigürasyon şeması
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Workflow değişken tanımları
CREATE TABLE IF NOT EXISTS workflow_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL, -- 'string', 'number', 'boolean', 'date', 'array', 'object'
  default_value text,
  description text,
  is_required boolean DEFAULT false,
  validation_rules jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Workflow izinleri
CREATE TABLE IF NOT EXISTS workflow_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  user_id uuid,
  role text NOT NULL, -- 'owner', 'editor', 'viewer', 'executor'
  created_at timestamptz DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_workflows_category ON workflows(category);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON workflows(created_by);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_start_time ON workflow_executions(start_time);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_variables_workflow_id ON workflow_variables(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_permissions_workflow_id ON workflow_permissions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_permissions_user_id ON workflow_permissions(user_id);

-- Trigger'lar
CREATE OR REPLACE FUNCTION update_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_workflow_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_updated_at();

CREATE TRIGGER trigger_update_workflow_template_updated_at
  BEFORE UPDATE ON workflow_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_updated_at();

-- Varsayılan node tiplerini ekle
INSERT INTO workflow_node_types (name, type, icon, description, config_schema) VALUES
('Talep Oluşturuldu', 'trigger', 'MessageSquare', 'Yeni talep oluşturulduğunda tetiklenir', '{"conditions": {"type": "object", "properties": {"category": {"type": "string"}, "priority": {"type": "string"}}}}'),
('Durum Değişti', 'trigger', 'RefreshCw', 'Talep durumu değiştiğinde tetiklenir', '{"conditions": {"type": "object", "properties": {"old_status": {"type": "string"}, "new_status": {"type": "string"}}}}'),
('Öncelik Güncellendi', 'trigger', 'Flag', 'Talep önceliği değiştiğinde tetiklenir', '{"conditions": {"type": "object", "properties": {"old_priority": {"type": "string"}, "new_priority": {"type": "string"}}}}'),
('Zaman Bazlı', 'trigger', 'Clock', 'Belirli zamanlarda tetiklenir', '{"schedule": {"type": "object", "properties": {"cron": {"type": "string"}, "timezone": {"type": "string"}}}}'),
('Koşul', 'condition', 'GitBranch', 'Mantıksal koşul kontrolü', '{"expression": {"type": "string"}, "operators": {"type": "array"}}'),
('E-posta Gönder', 'action', 'Mail', 'E-posta gönder', '{"template": {"type": "string"}, "recipients": {"type": "array"}, "subject": {"type": "string"}}'),
('Talep Ata', 'action', 'UserCheck', 'Talebi temsilciye ata', '{"assignment_type": {"type": "string"}, "agent_id": {"type": "string"}, "skills": {"type": "array"}}'),
('Durum Güncelle', 'action', 'Edit', 'Talep durumunu güncelle', '{"new_status": {"type": "string"}, "comment": {"type": "string"}}'),
('Bildirim Gönder', 'action', 'Bell', 'Bildirim gönder', '{"channel": {"type": "string"}, "message": {"type": "string"}, "recipients": {"type": "array"}}'),
('Webhook', 'action', 'Globe', 'Dış sisteme webhook gönder', '{"url": {"type": "string"}, "method": {"type": "string"}, "headers": {"type": "object"}, "body": {"type": "object"}}'),
('Onay', 'approval', 'CheckCircle', 'Onay süreci', '{"approvers": {"type": "array"}, "timeout": {"type": "number"}, "auto_approve": {"type": "boolean"}}'),
('Beklet', 'action', 'Pause', 'İşlemi belirli süre beklet', '{"duration": {"type": "number"}, "unit": {"type": "string"}}')
ON CONFLICT (type) DO NOTHING;

-- Varsayılan şablonları ekle
INSERT INTO workflow_templates (name, description, category, template_data, is_public) VALUES
('Otomatik Talep Atama', 'Yeni talepleri otomatik olarak uygun temsilciye atar', 'ticket', '{"nodes": [{"id": "1", "type": "trigger", "data": {"type": "ticket_created"}}, {"id": "2", "type": "action", "data": {"type": "assign_ticket"}}], "connections": [{"from": "1", "to": "2"}]}', true),
('SLA İhlali Yükseltme', 'SLA ihlali durumunda talebi yükseltir', 'ticket', '{"nodes": [{"id": "1", "type": "trigger", "data": {"type": "sla_breach"}}, {"id": "2", "type": "action", "data": {"type": "escalate"}}], "connections": [{"from": "1", "to": "2"}]}', true),
('Müşteri Bildirimi', 'Talep durumu değiştiğinde müşteriye bildirim gönderir', 'notification', '{"nodes": [{"id": "1", "type": "trigger", "data": {"type": "status_changed"}}, {"id": "2", "type": "action", "data": {"type": "send_email"}}], "connections": [{"from": "1", "to": "2"}]}', true)
ON CONFLICT DO NOTHING;

-- RLS politikaları (geliştirme aşamasında devre dışı)
-- ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE workflow_variables ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE workflow_permissions ENABLE ROW LEVEL SECURITY;

-- RLS politikaları (yorum satırlarında hazır)
/*
-- Workflows için RLS
CREATE POLICY "Users can view their own workflows" ON workflows
  FOR SELECT USING (created_by = auth.uid() OR id IN (
    SELECT workflow_id FROM workflow_permissions WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create workflows" ON workflows
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own workflows" ON workflows
  FOR UPDATE USING (created_by = auth.uid() OR id IN (
    SELECT workflow_id FROM workflow_permissions WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
  ));

CREATE POLICY "Users can delete their own workflows" ON workflows
  FOR DELETE USING (created_by = auth.uid());

-- Workflow executions için RLS
CREATE POLICY "Users can view workflow executions" ON workflow_executions
  FOR SELECT USING (workflow_id IN (
    SELECT id FROM workflows WHERE created_by = auth.uid()
    UNION
    SELECT workflow_id FROM workflow_permissions WHERE user_id = auth.uid()
  ));

-- Workflow templates için RLS
CREATE POLICY "Users can view public templates" ON workflow_templates
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create templates" ON workflow_templates
  FOR INSERT WITH CHECK (created_by = auth.uid());
*/

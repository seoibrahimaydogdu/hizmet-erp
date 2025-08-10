/*
  # Admin Panel Tabloları Düzeltmesi

  1. Yeni Tablolar
    - `customers` - Müşteri bilgileri
    - `agents` - Temsilci bilgileri  
    - `tickets` - Destek talepleri
    - `system_logs` - Sistem logları
    - `templates` - Email şablonları
    - `automations` - Otomasyon kuralları

  2. İlişkiler
    - tickets -> customers (customer_id)
    - tickets -> agents (agent_id)

  3. Güvenlik
    - Tüm tablolar için RLS etkin
    - Public erişim politikaları
*/

-- Customers tablosu
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  company text,
  plan text DEFAULT 'basic',
  satisfaction_score integer DEFAULT 0,
  total_tickets integer DEFAULT 0,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON customers
  FOR SELECT TO public USING (true);

CREATE POLICY "Enable insert for all users" ON customers
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON customers
  FOR UPDATE TO public USING (true);

-- Agents tablosu
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'agent',
  status text DEFAULT 'online',
  performance_score integer DEFAULT 0,
  total_resolved integer DEFAULT 0,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON agents
  FOR SELECT TO public USING (true);

CREATE POLICY "Enable insert for all users" ON agents
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON agents
  FOR UPDATE TO public USING (true);

-- Tickets tablosu
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text DEFAULT 'open',
  priority text DEFAULT 'medium',
  category text DEFAULT 'general',
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  satisfaction_rating integer
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON tickets
  FOR SELECT TO public USING (true);

CREATE POLICY "Enable insert for all users" ON tickets
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON tickets
  FOR UPDATE TO public USING (true);

-- System logs tablosu
CREATE TABLE IF NOT EXISTS system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  user_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON system_logs
  FOR SELECT TO public USING (true);

CREATE POLICY "Enable insert for all users" ON system_logs
  FOR INSERT TO public WITH CHECK (true);

-- Templates tablosu
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  type text DEFAULT 'email',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON templates
  FOR SELECT TO public USING (true);

CREATE POLICY "Enable insert for all users" ON templates
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON templates
  FOR UPDATE TO public USING (true);

-- Automations tablosu
CREATE TABLE IF NOT EXISTS automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL,
  conditions jsonb DEFAULT '{}',
  actions jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON automations
  FOR SELECT TO public USING (true);

CREATE POLICY "Enable insert for all users" ON automations
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON automations
  FOR UPDATE TO public USING (true);

-- Örnek veriler ekle
INSERT INTO customers (name, email, company, plan, satisfaction_score, total_tickets, avatar_url) VALUES
('Ahmet Yılmaz', 'ahmet@example.com', 'ABC Şirketi', 'premium', 95, 12, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'),
('Ayşe Demir', 'ayse@example.com', 'XYZ Ltd', 'basic', 88, 8, 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150'),
('Mehmet Kaya', 'mehmet@example.com', 'Tech Corp', 'enterprise', 92, 15, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150')
ON CONFLICT (email) DO NOTHING;

INSERT INTO agents (name, email, role, status, performance_score, total_resolved, avatar_url) VALUES
('Elif Özkan', 'elif@company.com', 'senior_agent', 'online', 94, 156, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'),
('Can Arslan', 'can@company.com', 'agent', 'busy', 87, 98, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
('Zeynep Şahin', 'zeynep@company.com', 'team_lead', 'online', 96, 203, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')
ON CONFLICT (email) DO NOTHING;

-- Tickets için örnek veriler (customer_id ve agent_id'leri dinamik olarak al)
DO $$
DECLARE
    customer1_id uuid;
    customer2_id uuid;
    customer3_id uuid;
    agent1_id uuid;
    agent2_id uuid;
    agent3_id uuid;
BEGIN
    SELECT id INTO customer1_id FROM customers WHERE email = 'ahmet@example.com';
    SELECT id INTO customer2_id FROM customers WHERE email = 'ayse@example.com';
    SELECT id INTO customer3_id FROM customers WHERE email = 'mehmet@example.com';
    
    SELECT id INTO agent1_id FROM agents WHERE email = 'elif@company.com';
    SELECT id INTO agent2_id FROM agents WHERE email = 'can@company.com';
    SELECT id INTO agent3_id FROM agents WHERE email = 'zeynep@company.com';
    
    INSERT INTO tickets (title, description, status, priority, category, customer_id, agent_id, satisfaction_rating) VALUES
    ('Giriş sorunu', 'Sisteme giriş yapamıyorum', 'open', 'high', 'technical', customer1_id, agent1_id, null),
    ('Fatura hatası', 'Faturamda yanlış tutar görünüyor', 'in_progress', 'medium', 'billing', customer2_id, agent2_id, null),
    ('Özellik talebi', 'Yeni rapor özelliği eklenebilir mi?', 'resolved', 'low', 'feature_request', customer3_id, agent3_id, 5),
    ('Performans sorunu', 'Sistem çok yavaş çalışıyor', 'open', 'high', 'technical', customer1_id, agent1_id, null),
    ('Hesap kapatma', 'Hesabımı kapatmak istiyorum', 'in_progress', 'medium', 'account', customer2_id, agent3_id, null);
END $$;

INSERT INTO templates (name, subject, content, type) VALUES
('Hoş Geldin', 'Hoş Geldiniz!', 'Merhaba {{name}}, sistemimize hoş geldiniz!', 'email'),
('Ticket Çözüldü', 'Talebiniz Çözüldü', 'Sayın {{name}}, talebiniz başarıyla çözülmüştür.', 'email'),
('SLA Uyarısı', 'SLA Süresi Dolmak Üzere', 'Ticket #{{ticket_id}} için SLA süresi dolmak üzere.', 'internal');

INSERT INTO automations (name, trigger_type, conditions, actions) VALUES
('Yüksek Öncelik Uyarısı', 'ticket_created', '{"priority": "high"}', '{"notify_manager": true, "escalate_after": 30}'),
('Otomatik Atama', 'ticket_created', '{"category": "technical"}', '{"assign_to_team": "technical_team"}'),
('Memnuniyet Anketi', 'ticket_resolved', '{}', '{"send_survey": true, "delay_minutes": 60}');
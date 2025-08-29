-- Churn recovery actions tablosu
CREATE TABLE IF NOT EXISTS churn_recovery_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  action_type text NOT NULL, -- 'email', 'call', 'discount', 'upgrade', 'gift', 'survey'
  message text,
  status text DEFAULT 'pending', -- 'pending', 'sent', 'completed', 'failed'
  response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_by uuid,
  notes text
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_churn_recovery_customer_id ON churn_recovery_actions(customer_id);
CREATE INDEX IF NOT EXISTS idx_churn_recovery_status ON churn_recovery_actions(status);
CREATE INDEX IF NOT EXISTS idx_churn_recovery_created_at ON churn_recovery_actions(created_at);

-- RLS politikaları
ALTER TABLE churn_recovery_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON churn_recovery_actions
  FOR SELECT TO public USING (true);

CREATE POLICY "Enable insert for all users" ON churn_recovery_actions
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON churn_recovery_actions
  FOR UPDATE TO public USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_churn_recovery_actions_updated_at 
  BEFORE UPDATE ON churn_recovery_actions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Örnek recovery action verileri
INSERT INTO churn_recovery_actions (id, customer_id, action_type, message, status, created_at) VALUES
('recovery-001', '11111111-1111-1111-1111-111111111111', 'email', 'Merhaba Mehmet, ayrılışınızı öğrendiğimizde üzüldük. Size özel %20 indirim teklifimiz var.', 'sent', '2024-12-16 10:00:00'),
('recovery-002', '22222222-2222-2222-2222-222222222222', 'call', 'Ayşe ile telefon görüşmesi yapıldı. Kullanım zorluğu yaşadığını belirtti.', 'completed', '2024-12-19 14:30:00'),
('recovery-003', '33333333-3333-3333-3333-333333333333', 'discount', 'Ali için %30 indirim teklifi gönderildi.', 'pending', '2024-12-21 09:15:00'),
('recovery-004', '44444444-4444-4444-4444-444444444444', 'upgrade', 'Zeynep için ücretsiz plan yükseltme teklifi gönderildi.', 'sent', '2024-12-23 11:45:00'),
('recovery-005', '66666666-6666-6666-6666-666666666666', 'survey', 'Fatma için memnuniyet anketi gönderildi.', 'pending', '2024-12-26 16:20:00'),
('recovery-006', '99999999-9999-9999-9999-999999999999', 'gift', 'Hasan için özel hediye paketi hazırlandı.', 'completed', '2024-12-29 13:10:00')
ON CONFLICT (id) DO NOTHING;

-- Payments tablosu için RLS'yi devre dışı bırak
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Diğer tablolar için de RLS'yi devre dışı bırak (demo amaçlı)
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotions DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports DISABLE ROW LEVEL SECURITY;

-- RLS durumunu kontrol et
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('payments', 'customers', 'subscriptions', 'expenses', 'expense_categories', 'promotions', 'promotion_usage', 'budgets', 'financial_reports');

-- Payments tablosu için RLS'yi geçici olarak devre dışı bırak
-- Bu migration demo amaçlıdır ve production'da kullanılmamalıdır

-- Payments tablosu için RLS'yi devre dışı bırak
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Eğer RLS'yi tekrar etkinleştirmek isterseniz:
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

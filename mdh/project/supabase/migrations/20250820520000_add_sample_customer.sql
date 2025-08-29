-- Ayşe Demir için örnek müşteri kaydı
INSERT INTO customers (
  id,
  name,
  email,
  phone,
  company,
  plan,
  currency,
  satisfaction_score,
  total_tickets,
  avatar_url,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001', -- Sabit UUID
  'Ayşe Demir',
  'ayse.demir@example.com',
  '+90 532 123 45 67',
  'Demir Teknoloji A.Ş.',
  'premium',
  'TRY',
  85,
  12,
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
  '2024-01-15 09:30:00+03',
  '2024-08-20 14:45:00+03'
) ON CONFLICT (email) DO NOTHING;

-- Ayşe Demir için örnek talepler
INSERT INTO tickets (
  id,
  title,
  description,
  status,
  priority,
  category,
  customer_id,
  created_at,
  updated_at
) VALUES 
(
  '660e8400-e29b-41d4-a716-446655440001',
  'Ödeme sistemi entegrasyonu sorunu',
  'Merhaba, ödeme sistemimizde entegrasyon sorunu yaşıyoruz. Müşteriler ödeme yaparken hata alıyor. Acil çözüm gerekiyor.',
  'in_progress',
  'high',
  'payment',
  '550e8400-e29b-41d4-a716-446655440001',
  '2024-08-18 10:15:00+03',
  '2024-08-19 16:30:00+03'
),
(
  '660e8400-e29b-41d4-a716-446655440002',
  'Yeni özellik talebi: Raporlama modülü',
  'Mevcut raporlama modülümüz yetersiz. Daha detaylı analiz raporları ve grafikler istiyoruz. Bu özellik müşterilerimiz için çok önemli.',
  'open',
  'medium',
  'feature_request',
  '550e8400-e29b-41d4-a716-446655440001',
  '2024-08-20 09:00:00+03',
  '2024-08-20 09:00:00+03'
),
(
  '660e8400-e29b-41d4-a716-446655440003',
  'Teknik destek: API dokümantasyonu',
  'API dokümantasyonunuzda eksik bilgiler var. Özellikle authentication kısmında detaylı örnekler gerekiyor.',
  'resolved',
  'low',
  'technical',
  '550e8400-e29b-41d4-a716-446655440001',
  '2024-08-15 14:20:00+03',
  '2024-08-17 11:45:00+03'
),
(
  '660e8400-e29b-41d4-a716-446655440004',
  'Fatura düzenleme sorunu',
  'Fatura oluştururken vergi hesaplaması yanlış yapılıyor. Bu durum muhasebe işlemlerimizi etkiliyor.',
  'closed',
  'high',
  'billing',
  '550e8400-e29b-41d4-a716-446655440001',
  '2024-08-10 16:45:00+03',
  '2024-08-12 10:30:00+03'
),
(
  '660e8400-e29b-41d4-a716-446655440005',
  'Ödeme hatırlatması',
  'Aylık ödeme tarihimiz yaklaşıyor. Ödeme planı hakkında bilgi almak istiyoruz.',
  'open',
  'medium',
  'payment_reminder',
  '550e8400-e29b-41d4-a716-446655440001',
  '2024-08-20 13:30:00+03',
  '2024-08-20 13:30:00+03'
)
ON CONFLICT (id) DO NOTHING;

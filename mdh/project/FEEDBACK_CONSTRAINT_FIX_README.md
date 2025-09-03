# 🔧 Feedback Foreign Key Constraint Düzeltmesi

## 🚨 Sorun
`insert or update on table "feedback_requests" violates foreign key constraint "feedback_requests_user_id_fkey"` hatası alınıyor.

## 🔍 Sorunun Nedeni
- `feedback_requests` tablosundaki `user_id` alanı `auth.users(id)` tablosuna foreign key ile bağlı
- Ancak mevcut UserContext'te kullanıcı ID'si gerçek Supabase auth.users tablosundan gelmiyor
- Sadece localStorage'dan gelen simüle edilmiş ID kullanılıyor
- Bu ID auth.users tablosunda mevcut olmadığı için foreign key constraint hatası oluşuyor

## ✅ Çözüm

### 1. Frontend Düzeltmesi (Tamamlandı)
- `FeedbackModal.tsx`'de `user_id` alanı artık gönderilmiyor
- `user_name` ile kullanıcı bilgisi saklanıyor
- Guest kullanıcılar da geri bildirim gönderebiliyor

### 2. Veritabanı Düzeltmesi

#### Otomatik Çözüm (Önerilen)
```bash
# Environment variables'ları ayarlayın
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Script'i çalıştırın
node run-feedback-constraint-fix.js
```

#### Manuel Çözüm
Supabase Dashboard > SQL Editor'de aşağıdaki komutları çalıştırın:

```sql
-- Foreign key constraint'i kaldır
ALTER TABLE feedback_requests DROP CONSTRAINT IF EXISTS feedback_requests_user_id_fkey;

-- user_id alanını nullable yap
ALTER TABLE feedback_requests ALTER COLUMN user_id DROP NOT NULL;

-- Açıklama ekle
COMMENT ON COLUMN feedback_requests.user_id IS 'User ID (can be NULL for guest users, no longer references auth.users)';

-- Index'i güncelle
DROP INDEX IF EXISTS idx_feedback_user_id;
CREATE INDEX idx_feedback_user_id ON feedback_requests(user_id) WHERE user_id IS NOT NULL;
```

## 📋 Yapılan Değişiklikler

### Frontend (FeedbackModal.tsx)
- ✅ `user_id` alanı kaldırıldı
- ✅ `user_name` ile kullanıcı bilgisi saklanıyor
- ✅ Guest kullanıcılar için destek eklendi
- ✅ Foreign key constraint hatası önlendi

### Veritabanı
- ✅ `user_id` foreign key constraint kaldırıldı
- ✅ `user_id` alanı nullable yapıldı
- ✅ Index güncellendi (NULL değerler için optimize edildi)

## 🧪 Test

### Test Senaryoları
1. **Guest Kullanıcı**: Geri bildirim gönderebilmeli
2. **Authenticated Kullanıcı**: Geri bildirim gönderebilmeli
3. **Foreign Key Hatası**: Artık oluşmamalı

### Test Komutları
```bash
# Migration'ı test et
node run-feedback-constraint-fix.js

# Frontend'i test et
npm run dev
# FeedbackModal'ı aç ve geri bildirim gönder
```

## 🔒 Güvenlik

### RLS (Row Level Security)
- Şimdilik RLS disabled
- Tüm kullanıcılar geri bildirim gönderebilir
- `user_name` ile kullanıcı takibi yapılıyor

### Gelecek Geliştirmeler
- [ ] RLS politikalarını aktif et
- [ ] Gerçek Supabase auth entegrasyonu
- [ ] Kullanıcı bazlı geri bildirim görüntüleme

## 📚 İlgili Dosyalar

- `src/components/common/FeedbackModal.tsx` - Ana bileşen
- `supabase/migrations/20250115000009_fix_feedback_user_id_constraint.sql` - Migration
- `run-feedback-constraint-fix.js` - Otomatik düzeltme script'i
- `supabase/migrations/20250115000000_create_feedback_table.sql` - Orijinal tablo

## 🆘 Destek

Sorun devam ederse:

1. **Console Log'ları**: Browser console'da hata mesajlarını kontrol edin
2. **Veritabanı**: Supabase Dashboard'da tablo yapısını kontrol edin
3. **Migration**: Migration dosyasının çalıştığından emin olun
4. **Environment Variables**: Supabase URL ve key'lerin doğru olduğunu kontrol edin

## 📝 Notlar

- Bu düzeltme geçici bir çözümdür
- Uzun vadede gerçek Supabase auth entegrasyonu yapılmalı
- `user_name` ile kullanıcı takibi yeterli olacaktır
- Guest kullanıcılar da geri bildirim gönderebilir

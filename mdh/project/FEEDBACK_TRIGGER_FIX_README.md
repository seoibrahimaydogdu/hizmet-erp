# 🔧 Feedback Trigger Sorunu Düzeltme Rehberi

## 🚨 Sorun
Feedback sistemi çalışırken `stack depth limit exceeded` hatası alınıyor. Bu, SQL trigger'larında sonsuz döngü olduğunu gösterir.

## 🔍 Sorunun Nedeni
`calculate_feedback_queue_position` trigger'ı her INSERT/UPDATE'de çalışıyor ve kendini sürekli tetikliyor.

## ✅ ÇÖZÜM (Güncellenmiş)

### 1. Manuel SQL Çalıştırma (Önerilen)

**Supabase Dashboard'da:**
1. **SQL Editor**'ü açın
2. **fix-feedback-trigger.sql** dosyasındaki tüm komutları kopyalayın
3. **Run** butonuna tıklayın

### 2. Node.js Script ile Çalıştırma

```bash
# Environment variables'ları ayarlayın
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Script'i çalıştırın
node fix-feedback-trigger.js
```

## 📋 YAPILAN DEĞİŞİKLİKLER

### ❌ Eski (Sorunlu) Trigger:
```sql
-- Sonsuz döngü yaratan trigger
CREATE TRIGGER update_feedback_queue_position
  AFTER INSERT OR UPDATE ON feedback_requests  -- ← SORUN: UPDATE da tetikleniyor
  FOR EACH ROW
  EXECUTE FUNCTION calculate_feedback_queue_position();
```

### ✅ Yeni (Düzeltilmiş) Trigger:
```sql
-- Sadece INSERT'de çalışan trigger
CREATE TRIGGER update_feedback_queue_position
  BEFORE INSERT ON feedback_requests  -- ← SADECE INSERT
  FOR EACH ROW
  EXECUTE FUNCTION calculate_feedback_queue_position();
```

### 🔧 Fonksiyon Düzeltmesi:
```sql
-- Eski: Tüm kayıtları güncelliyordu (UPDATE tetikliyordu)
UPDATE feedback_requests SET queue_position = ...;

-- Yeni: Sadece yeni kayıt için hesaplıyor
NEW.queue_position = (SELECT COALESCE(MAX(queue_position), 0) + 1 FROM ...);
```

### 🆕 Yeni Özellik:
- ✅ `user_name` kolonu eklendi
- ✅ Kullanıcı adı artık feedback'de saklanıyor
- ✅ UI'da kullanıcı ID yerine kullanıcı adı gösteriliyor

## 🗑️ TEMİZLİK İŞLEMİ

**Önemli:** Bu script mevcut `feedback_requests` tablosunu **tamamen silip yeniden oluşturuyor**:
- ❌ Mevcut feedback verileri **kaybolacak**
- ✅ Trigger sorunları **tamamen çözülecek**
- ✅ Yeni `user_name` kolonu **eklenecek**

## 🎯 SONUÇ
- ✅ Sonsuz döngü sorunu çözüldü
- ✅ Feedback sistemi artık çalışacak
- ✅ Queue position otomatik hesaplanacak
- ✅ Performance iyileştirildi
- ✅ Kullanıcı adı desteği eklendi

## 🧪 TEST
Düzeltme sonrası:
1. Feedback formunu açın
2. Geri bildirim göndermeyi deneyin
3. Console'da hata olmadığını kontrol edin
4. Veritabanında kayıt oluştuğunu doğrulayın
5. `user_name` kolonunun dolu olduğunu kontrol edin

## ⚠️ UYARI
**Dikkat:** Bu script mevcut feedback verilerini sileceği için, sadece **geliştirme ortamında** kullanın. Production'da kullanmadan önce veri yedeklemesi yapın.

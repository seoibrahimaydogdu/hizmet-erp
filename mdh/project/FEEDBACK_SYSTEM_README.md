# Geri Bildirim Sistemi

Bu sistem, kullanıcıların ürün hakkında geri bildirimde bulunmasını ve bu geri bildirimlerin yönetilmesini sağlar.

## Özellikler

### 🎯 Kullanıcı Tarafı
- **Geri Bildirim Butonu**: Her sayfanın sağ üst köşesinde mavi chat bubble ikonu
- **Pop-up Form**: Konu, mesaj, tür seçimi ile detaylı geri bildirim
- **Otomatik Bilgi Toplama**: Sayfa kaynağı, kullanıcı ID, tarayıcı, işletim sistemi
- **Talepleri Takip**: Gönderilen geri bildirimlerin durumunu görme
- **Sıra Bilgisi**: Kaç kişi sırada, ne kadar süreceği

### 🔧 Admin Tarafı
- **Geri Bildirim Yönetimi**: Tüm geri bildirimleri görme ve düzenleme
- **Durum Güncelleme**: Beklemede, işleniyor, çözüldü, kapatıldı
- **Admin Notları**: Geri bildirimlere not ekleme
- **Tahmini Süre**: Çözüm için süre belirleme
- **Filtreleme**: Durum, tür ve arama ile filtreleme

## Kurulum

### 1. Veritabanı Tablosu
```bash
# Migration dosyasını çalıştır
node run-feedback-migration.js
```

### 2. Bileşenler
- `FeedbackButton.tsx` - Her sayfada görünen geri bildirim butonu
- `FeedbackModal.tsx` - Geri bildirim formu
- `FeedbackTab.tsx` - Admin panelinde geri bildirim yönetimi
- `FeedbackRequestsPage.tsx` - Müşteri panelinde talep takibi

## Kullanım

### Kullanıcı Geri Bildirimi
1. Herhangi bir sayfada sağ üstteki "Geri Bildirim gönder" butonuna tıkla
2. Konu ve mesaj (en az 15 kelime) gir
3. Geri bildirim türünü seç (Hata/Özellik/Genel/Diğer)
4. Gönder butonuna tıkla

### Admin Yönetimi
1. Admin panelinde "Talepler" sekmesine git
2. "Geri Bildirimler" sekmesini seç
3. Geri bildirimleri filtrele ve düzenle
4. Durum güncelle, admin notu ekle, süre belirle

### Müşteri Takibi
1. Müşteri portalında "Geri Bildirimlerim" sekmesine git
2. Gönderilen talepleri gör ve durumlarını takip et
3. Sıra bilgisi ve tahmini süreleri kontrol et

## Veritabanı Yapısı

### `feedback_requests` Tablosu
```sql
- id: UUID (Primary Key)
- subject: TEXT (Konu)
- message: TEXT (Mesaj)
- type: TEXT (Hata/Özellik/Genel/Diğer)
- page_source: TEXT (Hangi sayfadan)
- user_id: UUID (Kullanıcı ID)
- browser_info: TEXT (Tarayıcı bilgisi)
- os_info: TEXT (İşletim sistemi)
- status: TEXT (Beklemede/İşleniyor/Çözüldü/Kapatıldı)
- priority: TEXT (Düşük/Orta/Yüksek/Acil)
- queue_position: INTEGER (Sıra pozisyonu)
- estimated_duration_minutes: INTEGER (Tahmini süre)
- admin_notes: TEXT (Admin notları)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## Teknik Detaylar

### Z-Index Yapısı
- FeedbackButton: `z-40`
- FeedbackModal: `z-30`
- Admin Edit Modal: `z-50`

### Otomatik Özellikler
- Tarayıcı ve OS tespiti
- Sayfa kaynağı otomatik kaydetme
- Zaman damgası
- Sıra pozisyonu hesaplama
- Güncelleme zamanı takibi

### Güvenlik
- RLS şimdilik disabled
- Kullanıcı sadece kendi geri bildirimlerini görebilir
- Admin tüm geri bildirimleri yönetebilir

## Geliştirme Notları

### Yapılacaklar
- [ ] RLS politikalarını aktif et
- [ ] Dosya ekleme özelliği
- [ ] E-posta bildirimleri
- [ ] Geri bildirim şablonları
- [ ] İstatistik raporları

### Bilinen Sorunlar
- RLS şimdilik disabled (user_profiles tablosu yok)
- Toast import'u FeedbackTab'de eksik olabilir

## Test

### Manuel Test
1. Farklı sayfalarda geri bildirim butonunu test et
2. Form validasyonunu kontrol et (15 kelime minimum)
3. Admin panelinde geri bildirim yönetimini test et
4. Müşteri portalında talep takibini test et

### Otomatik Test
```bash
# Test script'i çalıştır
npm test -- --testPathPattern=feedback
```

## Destek

Herhangi bir sorun yaşarsanız:
1. Console log'ları kontrol edin
2. Veritabanı bağlantısını test edin
3. Migration dosyasının çalıştığından emin olun
4. Supabase RLS politikalarını kontrol edin

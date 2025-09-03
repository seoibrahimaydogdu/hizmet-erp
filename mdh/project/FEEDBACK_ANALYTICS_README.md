# 🎯 Müşteri Geri Bildirimini Ürün Yol Haritasına Dönüştürme Sistemi

Bu sistem, müşteri geri bildirimlerini analiz ederek ürün geliştirme ekibi için öncelikli bir "yapılacaklar listesi" oluşturur.

## 🚀 Özellikler

### 1. Gelişmiş Geri Bildirim Toplama
- **Duygusal Etki Skoru**: 1-10 arası, kullanıcının sorundan ne kadar etkilendiğini ölçer
- **Akıllı Etiketleme**: Önceden tanımlanmış etiketler (Hata, Güvenlik, Ödeme, Performans, vb.)
- **Otomatik Teknik Bilgi**: Tarayıcı, OS, sayfa kaynağı otomatik toplanır

### 2. Akıllı Önceliklendirme
- **Çok Faktörlü Skorlama**: Duygusal etki + Etiket türü + Sayfa kaynağı + Tekrarlanma
- **Kritik Sayfa Algılama**: Ödeme, giriş gibi kritik sayfalar otomatik yüksek öncelik
- **Güvenlik Önceliği**: Güvenlik etiketli geri bildirimler otomatik yüksek öncelik

### 3. Görev Listesi ve Analiz
- **Otomatik Kümeleme**: Benzer geri bildirimler otomatik gruplanır
- **Öncelik Sıralaması**: En yüksek öncelikli görevler üstte
- **İstatistikler**: Toplam görev sayısı, öncelik dağılımı
- **Filtreleme**: Yüksek/Orta/Düşük öncelik filtreleme

## 📊 Veri Yapısı

### Feedback Tablosu (feedback_requests)
```sql
- id: UUID (Primary Key)
- subject: TEXT (Konu)
- message: TEXT (Mesaj)
- type: TEXT (error/feature/general/other)
- page_source: TEXT (Sayfa kaynağı)
- emotional_impact_score: INTEGER (1-10 arası)
- tags: TEXT[] (Etiketler dizisi)
- status: TEXT (pending/in_progress/resolved/closed)
- priority: TEXT (low/medium/high/urgent)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Öncelik Skoru Hesaplama
```sql
Öncelik Skoru = (Duygusal Etki × Tür Çarpanı × Kaynak Çarpanı) + Etiket Bonusu

Tür Çarpanları:
- Hata: 3x
- Genel: 2x  
- Özellik: 1x

Kaynak Çarpanları:
- Ödeme/Giriş: 3x
- Dashboard: 2x
- Diğer: 1x

Etiket Bonusları:
- Güvenlik: +2
- Hata: +2
- Ödeme: +1
- Performans: +1
```

## 🛠️ Kurulum

### 1. Migration Çalıştır
```bash
cd mdh/project
node run-feedback-migration.js
```

### 2. Uygulamayı Başlat
```bash
npm run dev
```

### 3. Kullanım
1. **Agents sayfasına git**
2. **"Görev Listesi" tab'ına tıkla**
3. **Geri bildirimleri analiz et ve görev listesini gör**

## 📱 Kullanıcı Arayüzü

### FeedbackModal
- Duygusal etki skoru slider'ı (1-10)
- Çoklu etiket seçimi
- Gelişmiş form validasyonu
- Otomatik teknik bilgi toplama

### Görev Listesi Tab
- **İstatistik Kartları**: Toplam, Yüksek, Orta, Düşük öncelik
- **Görev Kartları**: Her görev için detaylı bilgi
- **Filtreleme**: Öncelik seviyesine göre
- **Yenileme**: Manuel veri güncelleme

## 🔧 Teknik Detaylar

### Veri Analizi Algoritması
1. **Kümeleme**: Tür + İlk etiket bazında gruplama
2. **Skorlama**: Çok faktörlü öncelik hesaplama
3. **Sıralama**: Öncelik skoruna göre sıralama
4. **Aciliyet**: Skor bazında aciliyet belirleme

### Performans Optimizasyonu
- **GIN İndeksler**: Array operasyonları için
- **B-tree İndeksler**: Sayısal sıralama için
- **Lazy Loading**: Sadece görünen görevler yüklenir

## 📈 Gelecek Özellikler

- [ ] **AI Destekli Analiz**: Geri bildirim metinlerini otomatik kategorize etme
- [ ] **Trend Analizi**: Zaman içinde öncelik değişimlerini izleme
- [ ] **Otomatik Atama**: Görevleri geliştirici ekiplerine otomatik atama
- [ ] **SLA Takibi**: Görev çözüm sürelerini izleme
- [ ] **Entegrasyon**: Jira, GitHub gibi araçlarla entegrasyon

## 🐛 Sorun Giderme

### Yaygın Hatalar
1. **Migration Hatası**: Supabase bağlantısını kontrol et
2. **Veri Görünmüyor**: Feedback tablosunda veri olduğundan emin ol
3. **Skor Hesaplanmıyor**: Fonksiyonların oluşturulduğunu kontrol et

### Debug
```javascript
// Console'da kontrol et
console.log('Feedback Tasks:', feedbackTasks);
console.log('Loading State:', loadingTasks);
```

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Console hatalarını kontrol edin
2. Migration script'ini tekrar çalıştırın
3. Supabase bağlantısını test edin

---

**🎉 Sistem başarıyla kuruldu! Müşteri geri bildirimlerinizi akıllıca analiz edin ve ürününüzü geliştirin.**

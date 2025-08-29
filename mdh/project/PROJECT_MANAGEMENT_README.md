# 🚀 Akıllı Proje Yönetimi ve Tahminleme Sistemi

Bu modül, proje yönetimi süreçlerini optimize etmek ve riskleri önceden tahmin etmek için geliştirilmiş kapsamlı bir sistemdir.

## 📋 Özellikler

### 1. **Dinamik Kaynak Optimizasyonu**
- ✅ Personel yük analizi ve kullanım oranları
- ✅ Otomatik görev atama önerileri
- ✅ Beceri bazlı kaynak eşleştirme
- ✅ Yük dengeleme algoritmaları
- ✅ Gerçek zamanlı kaynak durumu takibi

### 2. **Proaktif Risk Analizi**
- ✅ Bütçe aşımı tahminlemesi
- ✅ Zaman çizelgesi risk değerlendirmesi
- ✅ Proje ilerleme analizi
- ✅ Risk skorlama sistemi
- ✅ Otomatik risk uyarıları

### 3. **Performans Tahminlemesi**
- ✅ Proje tamamlanma tarihi tahmini
- ✅ Maliyet tahminlemesi
- ✅ Güven oranı hesaplaması
- ✅ Aşama bazlı ilerleme analizi
- ✅ Trend analizi ve projeksiyonlar

### 4. **Otomatik Zaman Çizelgesi ve Görev Ataması**
- ✅ Proje aşamalarının otomatik oluşturulması
- ✅ Görev bağımlılıkları yönetimi
- ✅ Ekip üyesi atama önerileri
- ✅ Gantt chart görünümü
- ✅ Kritik yol analizi

## 🗄️ Veritabanı Yapısı

### Tablolar

#### 1. **projects** - Projeler
```sql
- id (UUID, Primary Key)
- name (VARCHAR) - Proje adı
- description (TEXT) - Proje açıklaması
- status (ENUM) - planning, active, completed, on_hold
- priority (ENUM) - low, medium, high, critical
- start_date (DATE) - Başlangıç tarihi
- end_date (DATE) - Bitiş tarihi
- budget (DECIMAL) - Bütçe
- actual_cost (DECIMAL) - Gerçek maliyet
- progress (INTEGER) - İlerleme yüzdesi
- team_size (INTEGER) - Ekip büyüklüğü
- risk_level (ENUM) - low, medium, high
- customer_id (UUID) - Müşteri referansı
- created_by (UUID) - Oluşturan kullanıcı
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2. **project_resources** - Proje Kaynakları
```sql
- id (UUID, Primary Key)
- name (VARCHAR) - Kaynak adı
- role (VARCHAR) - Rol/Pozisyon
- availability (INTEGER) - Müsaitlik (saat)
- current_load (INTEGER) - Mevcut yük (saat)
- skills (TEXT[]) - Beceriler dizisi
- hourly_rate (DECIMAL) - Saatlik ücret
- status (ENUM) - active, inactive, on_leave
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3. **project_tasks** - Proje Görevleri
```sql
- id (UUID, Primary Key)
- project_id (UUID) - Proje referansı
- name (VARCHAR) - Görev adı
- description (TEXT) - Görev açıklaması
- status (ENUM) - pending, in_progress, completed, blocked
- priority (ENUM) - low, medium, high
- assigned_to (UUID) - Atanan kaynak
- estimated_hours (INTEGER) - Tahmini saat
- actual_hours (INTEGER) - Gerçek saat
- start_date (DATE) - Başlangıç tarihi
- due_date (DATE) - Bitiş tarihi
- dependencies (UUID[]) - Bağımlılıklar
- progress (INTEGER) - İlerleme yüzdesi
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 4. **project_risks** - Proje Riskleri
```sql
- id (UUID, Primary Key)
- project_id (UUID) - Proje referansı
- risk_type (ENUM) - budget, schedule, resource, technical
- title (VARCHAR) - Risk başlığı
- description (TEXT) - Risk açıklaması
- probability (INTEGER) - Olasılık (0-100)
- impact (INTEGER) - Etki (0-100)
- mitigation_strategy (TEXT) - Azaltma stratejisi
- status (ENUM) - identified, monitoring, mitigated
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 5. **project_phases** - Proje Aşamaları
```sql
- id (UUID, Primary Key)
- project_id (UUID) - Proje referansı
- name (VARCHAR) - Aşama adı
- description (TEXT) - Aşama açıklaması
- duration (INTEGER) - Süre (gün)
- progress (INTEGER) - İlerleme yüzdesi
- start_date (DATE) - Başlangıç tarihi
- end_date (DATE) - Bitiş tarihi
- order_index (INTEGER) - Sıralama
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 6. **project_timeline** - Proje Zaman Çizelgesi
```sql
- id (UUID, Primary Key)
- project_id (UUID) - Proje referansı
- phase_id (UUID) - Aşama referansı
- task_id (UUID) - Görev referansı
- start_date (DATE) - Başlangıç tarihi
- end_date (DATE) - Bitiş tarihi
- assigned_resources (UUID[]) - Atanan kaynaklar
- created_at (TIMESTAMP)
```

## 🚀 Kurulum

### 1. Veritabanı Migration'ı Çalıştırma

#### Yöntem 1: Supabase Dashboard
1. Supabase Dashboard'a giriş yapın
2. SQL Editor'ü açın
3. `supabase/migrations/20241215_create_project_management_tables.sql` dosyasının içeriğini kopyalayın
4. SQL Editor'de çalıştırın

#### Yöntem 2: Node.js Script
```bash
# Environment variables'ları ayarlayın
export VITE_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Migration'ı çalıştırın
npm run project-migration
```

### 2. Uygulamayı Başlatma
```bash
npm run dev
```

## 📊 Kullanım

### 1. **Genel Bakış Sekmesi**
- Proje özeti kartları
- Aktif proje sayısı
- Toplam bütçe
- Ortalama ilerleme
- Risk skoru
- Detaylı proje listesi

### 2. **Kaynak Optimizasyonu Sekmesi**
- Personel kullanım oranları
- Yük analizi
- Beceri etiketleri
- Optimizasyon önerileri

### 3. **Risk Analizi Sekmesi**
- Proje bazlı risk skorları
- Tahmini tamamlanma tarihleri
- Bütçe durumu analizi
- Güven oranları

### 4. **Performans Tahminlemesi Sekmesi**
- Proje aşamaları
- İlerleme çubukları
- Tahmini maliyetler
- Tamamlanma tahminleri

### 5. **Zaman Çizelgesi Sekmesi**
- Görsel timeline
- Aşama bazlı görev atamaları
- İlerleme takibi
- Ekip üyesi önerileri

## 🔧 İşlemler

### Proje İşlemleri
- ✅ **Yeni Proje Oluşturma**: Modal form ile proje ekleme
- ✅ **Proje Düzenleme**: Mevcut projeleri güncelleme
- ✅ **Proje Silme**: Onay ile proje silme
- ✅ **Proje Görüntüleme**: Detaylı proje bilgileri

### Veri Yönetimi
- ✅ **Supabase Entegrasyonu**: Gerçek zamanlı veri senkronizasyonu
- ✅ **RLS Politikaları**: Güvenli veri erişimi
- ✅ **Trigger'lar**: Otomatik güncellemeler
- ✅ **İndeksler**: Performans optimizasyonu

## 🎯 Özellikler

### Akıllı Algoritmalar
- **Risk Skorlama**: Bütçe, zaman ve ilerleme bazlı risk hesaplama
- **Tahminleme**: Geçmiş verilere dayalı tamamlanma tahmini
- **Kaynak Optimizasyonu**: Yük dengeleme ve beceri eşleştirme
- **Zaman Çizelgesi**: Otomatik aşama ve görev oluşturma

### Kullanıcı Deneyimi
- **Responsive Tasarım**: Mobil ve desktop uyumlu
- **Dark Mode**: Karanlık tema desteği
- **Gerçek Zamanlı**: Anlık veri güncellemeleri
- **Toast Bildirimleri**: Kullanıcı geri bildirimleri

## 🔒 Güvenlik

### RLS (Row Level Security) Politikaları
- **Geliştirme Aşamasında**: RLS devre dışı bırakıldı
- **Üretim İçin**: RLS politikaları hazır (yorum satırlarında)
- Kullanıcı bazlı erişim kontrolü
- Veri bütünlüğü koruması

### Veri Doğrulama
- SQL seviyesinde constraint'ler
- TypeScript tip güvenliği
- Form validasyonu

## 📈 Performans

### Optimizasyonlar
- **İndeksler**: Hızlı sorgu performansı
- **Lazy Loading**: Sayfa bazlı veri yükleme
- **Caching**: Supabase cache kullanımı
- **Debouncing**: Arama optimizasyonu

## 🛠️ Teknik Detaylar

### Teknolojiler
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **State Management**: React Hooks
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast

### Mimari
- **Component-Based**: Modüler bileşen yapısı
- **Hook Pattern**: Custom hook'lar
- **Type Safety**: TypeScript interfaces
- **Error Handling**: Try-catch blokları
- **Loading States**: Skeleton ve spinner'lar

## 🚀 Gelecek Özellikler

### Planlanan Geliştirmeler
- [ ] **Gantt Chart**: İnteraktif zaman çizelgesi
- [ ] **Kanban Board**: Görev yönetimi
- [ ] **Time Tracking**: Zaman takibi
- [ ] **Reporting**: Detaylı raporlar
- [ ] **API Integration**: Üçüncü parti entegrasyonlar
- [ ] **Mobile App**: Mobil uygulama
- [ ] **AI Assistant**: Yapay zeka asistanı
- [ ] **Automation**: Otomatik iş akışları

## 📞 Destek

Herhangi bir sorun veya öneri için:
- GitHub Issues kullanın
- Dokümantasyonu kontrol edin
- Supabase Dashboard'ı inceleyin

---

**🎯 Akıllı Proje Yönetimi Sistemi** - Projelerinizi daha akıllı yönetin!

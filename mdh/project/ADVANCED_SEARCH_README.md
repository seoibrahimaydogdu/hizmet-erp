# Gelişmiş Arama ve Filtreleme Sistemi

Bu dokümantasyon, Admin Panel için geliştirilen gelişmiş arama ve filtreleme özelliğini açıklamaktadır.

## 🚀 Özellikler

### 🔍 Ana Arama Çubuğu
- **Çoklu Alan Arama**: Ad, e-posta, şirket, telefon, açıklama gibi tüm alanlarda arama
- **Tip Bazlı Filtreleme**: Talepler, müşteriler, ödemeler, temsilciler arasında seçim
- **Gerçek Zamanlı Arama**: Yazarken anında sonuçlar

### 📅 Tarih Filtreleri
- **Başlangıç Tarihi**: Belirli bir tarihten sonraki kayıtlar
- **Bitiş Tarihi**: Belirli bir tarihe kadar olan kayıtlar
- **Tarih Aralığı**: İki tarih arasındaki kayıtlar

### 🏷️ Durum ve Öncelik Filtreleri
- **Durum Filtreleri**: Açık, Kapalı, Beklemede, İşlemde, Çözüldü, İptal Edildi
- **Öncelik Filtreleri**: Düşük, Orta, Yüksek, Acil
- **Atanan Kişi**: Belirli bir temsilciye atanan kayıtlar

### 💰 Tutar Filtreleri
- **Minimum Tutar**: Belirli tutardan yüksek kayıtlar
- **Maksimum Tutar**: Belirli tutardan düşük kayıtlar
- **Tutar Aralığı**: İki tutar arasındaki kayıtlar

### 🏷️ Etiket Sistemi
- **Dinamik Etiket Ekleme**: Enter tuşu ile hızlı etiket ekleme
- **Etiket Bazlı Filtreleme**: Belirli etiketleri içeren kayıtlar
- **Görsel Etiket Gösterimi**: Renkli etiketler ile kolay tanıma
- **Kolay Etiket Kaldırma**: X butonu ile tek tıkla kaldırma

## 🆕 YENİ EKLENEN ÖZELLİKLER

### ⚡ Gelişmiş Arama Operatörleri
- **Boolean Operatörler**: AND, OR, NOT mantığı ile karmaşık sorgular
- **Regex Arama**: Düzenli ifadeler ile gelişmiş pattern matching
- **Wildcard Arama**: * ve ? karakterleri ile esnek arama
- **Phrase Search**: Tırnak içinde tam cümle arama
- **Alan Bazlı Arama**: Belirli alanlarda arama yapma

### 📚 Arama Geçmişi ve Kayıtlı Filtreler
- **Arama Geçmişi**: Son 50 aramayı görüntüleme
- **Favori Aramalar**: Sık kullanılan aramaları yıldızla işaretleme
- **Kayıtlı Filtreler**: Filtre kombinasyonlarını kaydetme
- **Kategori Sistemi**: Filtreleri kategorilere ayırma
- **Kullanım İstatistikleri**: Filtre kullanım sayısı ve son kullanım tarihi

### 🔧 Gelişmiş Filtreleme
- **Çoklu Seçim**: Birden fazla seçenek seçebilme
- **Hiyerarşik Filtreler**: Ana kategori ve alt kategoriler
- **Dinamik Filtre Oluşturma**: Özel filtre tanımlama
- **Filtre Sıralama**: Filtre gruplarını yeniden düzenleme
- **Görünürlük Kontrolü**: Filtre gruplarını gizleme/gösterme

## 📦 Kurulum

### 1. Bileşen İçe Aktarma
```tsx
import AdvancedSearch, { SearchFilters } from './components/AdvancedSearch';
import AdvancedSearchOperators from './components/AdvancedSearchOperators';
import SearchHistoryAndSavedFilters from './components/SearchHistoryAndSavedFilters';
import AdvancedFiltering from './components/AdvancedFiltering';
```

### 2. State Tanımlama
```tsx
const [advancedFilters, setAdvancedFilters] = useState<SearchFilters>({
  searchTerm: '',
  searchType: 'all',
  dateRange: { start: '', end: '' },
  status: '',
  priority: '',
  assignedTo: '',
  tags: [],
  amountRange: { min: '', max: '' },
  customFields: {}
});
```

### 3. Bileşen Kullanımı
```tsx
// Temel Gelişmiş Arama
<AdvancedSearch
  onSearch={(filters) => {
    setAdvancedFilters(filters);
    // Arama işlemi
  }}
  onClear={() => {
    setAdvancedFilters({
      searchTerm: '',
      searchType: 'all',
      dateRange: { start: '', end: '' },
      status: '',
      priority: '',
      assignedTo: '',
      tags: [],
      amountRange: { min: '', max: '' },
      customFields: {}
    });
  }}
  searchTypes={['tickets', 'customers', 'payments']}
/>

// Gelişmiş Operatörler
<AdvancedSearchOperators
  onSearch={(operators) => {
    // Operatör tabanlı arama
    console.log('Operatörler:', operators);
  }}
  onClear={() => {
    // Operatörleri temizle
  }}
/>

// Arama Geçmişi ve Kayıtlı Filtreler
<SearchHistoryAndSavedFilters
  onLoadSearch={(query, filters) => {
    // Kayıtlı arama/filtreyi yükle
    console.log('Yüklenen:', { query, filters });
  }}
  onSaveFilter={(name, description, filters, category) => {
    // Filtreyi kaydet
    console.log('Kaydedilen:', { name, description, filters, category });
  }}
/>

// Gelişmiş Filtreleme
<AdvancedFiltering
  onFiltersChange={(filters) => {
    // Filtre değişikliklerini yakala
    console.log('Filtreler:', filters);
  }}
  onClearAll={() => {
    // Tüm filtreleri temizle
  }}
/>
```

## 🔧 Özelleştirme

### Arama Tipleri
```tsx
// Tüm tipler
searchTypes={['all', 'tickets', 'customers', 'payments', 'agents', 'invoices']}

// Sadece belirli tipler
searchTypes={['tickets', 'customers']}
```

### CSS Sınıfları
```tsx
// Özel stil ekleme
<AdvancedSearch
  className="my-custom-class"
  // ... diğer props
/>
```

## 📊 Filtreleme Mantığı

### Temel Filtreleme
```tsx
const filteredData = data.filter(item => {
  // Arama terimi kontrolü
  const matchesSearch = !filters.searchTerm || 
    item.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(filters.searchTerm.toLowerCase());

  // Tip kontrolü
  const matchesType = filters.searchType === 'all' || 
    item.type === filters.searchType;

  // Durum kontrolü
  const matchesStatus = !filters.status || 
    item.status === filters.status;

  return matchesSearch && matchesType && matchesStatus;
});
```

### Gelişmiş Filtreleme
```tsx
const filteredData = data.filter(item => {
  // Tarih aralığı kontrolü
  const matchesDateRange = !filters.dateRange.start && !filters.dateRange.end || 
    (item.createdAt && 
     (!filters.dateRange.start || new Date(item.createdAt) >= new Date(filters.dateRange.start)) &&
     (!filters.dateRange.end || new Date(item.createdAt) <= new Date(filters.dateRange.end)));

  // Tutar aralığı kontrolü
  const matchesAmountRange = (filters.amountRange.min === '' || item.amount >= filters.amountRange.min) &&
                            (filters.amountRange.max === '' || item.amount <= filters.amountRange.max);

  // Etiket kontrolü
  const matchesTags = filters.tags.length === 0 || 
    filters.tags.some(tag => item.tags.includes(tag));

  return matchesDateRange && matchesAmountRange && matchesTags;
});
```

### Operatör Tabanlı Arama
```tsx
const applyOperators = (data: any[], operators: any[]) => {
  let results = [...data];
  
  operators.forEach(operator => {
    if (operator.type === 'boolean') {
      if (operator.operator === 'AND') {
        // Hem operatör 1 hem operatör 2 sağlanmalı
        results = results.filter(item => {
          const text = `${item.title} ${item.description}`.toLowerCase();
          return text.includes(operator.value.toLowerCase());
        });
      } else if (operator.operator === 'OR') {
        // Operatör 1 veya operatör 2 sağlanmalı
        const matchingItems = data.filter(item => {
          const text = `${item.title} ${item.description}`.toLowerCase();
          return text.includes(operator.value.toLowerCase());
        });
        results = [...new Set([...results, ...matchingItems])];
      } else if (operator.operator === 'NOT') {
        // Operatör sağlanmamalı
        results = results.filter(item => {
          const text = `${item.title} ${item.description}`.toLowerCase();
          return !text.includes(operator.value.toLowerCase());
        });
      }
    } else if (operator.type === 'regex') {
      try {
        const regex = new RegExp(operator.value, 'i');
        results = results.filter(item => {
          const text = `${item.title} ${item.description}`;
          return regex.test(text);
        });
      } catch (error) {
        console.error('Regex hatası:', error);
      }
    }
  });
  
  return results;
};
```

## 🎯 Kullanım Örnekleri

### Boolean Operatörler
```tsx
// "hata" AND "ödeme" → Hem hata hem ödeme içeren kayıtlar
// "teknik" OR "destek" → Teknik veya destek içeren kayıtlar
// "kapalı" NOT "eski" → Kapalı ama eski olmayan kayıtlar
```

### Regex Arama
```tsx
// ^[A-Z]{2}-\d{4}$ → İki büyük harf + tire + 4 rakam
// \d{3}-\d{3}-\d{4} → Telefon numarası formatı
// [A-Za-z]+@[A-Za-z]+\.[A-Za-z]+ → E-posta formatı
```

### Wildcard Arama
```tsx
// hata* → hata ile başlayan
// *sistem → sistem ile biten
// hata? → hata + tek karakter
```

### Phrase Search
```tsx
// "ödeme sorunu" → Tam cümle arama
// "teknik destek" → Kelime sırası önemli
```

## 🚀 Demo Sayfası

Yeni özellikleri test etmek için demo sayfasını kullanın:

```tsx
import AdvancedSearch from './components/AdvancedSearch';

// App.tsx veya router'da
<Route path="/advanced-search-demo" element={<AdvancedSearch />} />
```

## 📱 Responsive Tasarım

Tüm bileşenler mobil, tablet ve desktop cihazlarda optimize edilmiştir:

- **Mobil**: Dikey düzen, touch-friendly butonlar
- **Tablet**: Orta boyut düzen, optimize edilmiş spacing
- **Desktop**: Tam genişlik, gelişmiş hover efektleri

## 🌙 Dark Mode Desteği

Tüm bileşenler otomatik dark mode desteği ile gelir:

```tsx
// Tailwind CSS sınıfları otomatik olarak dark mode'a uyum sağlar
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
```

## 🔧 Gelecek Özellikler

- **AI Destekli Arama**: Semantic search ve otomatik öneriler
- **Görsel Arama**: Drag & drop filtre düzenleme
- **Real-time Collaboration**: Takım üyeleri arası filtre paylaşımı
- **Advanced Analytics**: Arama performans metrikleri
- **Export/Import**: Filtre konfigürasyonlarını dışa/içe aktarma

## 📝 Notlar

- Tüm bileşenler TypeScript ile yazılmıştır
- Tailwind CSS kullanılarak stillendirilmiştir
- Lucide React ikonları kullanılmıştır
- LocalStorage ile veri kalıcılığı sağlanmıştır
- Responsive tasarım prensipleri uygulanmıştır

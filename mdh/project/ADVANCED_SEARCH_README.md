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

## 📦 Kurulum

### 1. Bileşen İçe Aktarma
```tsx
import AdvancedSearch, { SearchFilters } from './components/AdvancedSearch';
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
    filters.tags.some(tag => 
      item.title.toLowerCase().includes(tag.toLowerCase()) ||
      item.description.toLowerCase().includes(tag.toLowerCase())
    );

  return matchesDateRange && matchesAmountRange && matchesTags;
});
```

## 🎨 UI/UX Özellikleri

### Responsive Tasarım
- **Mobil Uyumlu**: Küçük ekranlarda optimize edilmiş görünüm
- **Tablet Desteği**: Orta boyutlu ekranlarda ideal düzen
- **Desktop Optimizasyonu**: Büyük ekranlarda maksimum verimlilik

### Dark Mode Desteği
- **Otomatik Tema**: Sistem temasına göre otomatik değişim
- **Manuel Kontrol**: Kullanıcı tarafından tema değiştirme
- **Tutarlı Renkler**: Tüm temalarda tutarlı görünüm

### Erişilebilirlik
- **Klavye Navigasyonu**: Tab tuşu ile gezinme
- **Screen Reader Desteği**: ARIA etiketleri ile uyumluluk
- **Yüksek Kontrast**: Görme engelli kullanıcılar için optimize

## 🔍 Kullanım Örnekleri

### Müşteri Arama
```tsx
// Premium müşterileri bul
<AdvancedSearch
  searchTypes={['customers']}
  onSearch={(filters) => {
    // Premium müşterileri filtrele
    const premiumCustomers = customers.filter(customer => 
      customer.plan === 'premium' && 
      customer.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
    );
  }}
/>
```

### Talep Arama
```tsx
// Yüksek öncelikli açık talepleri bul
<AdvancedSearch
  searchTypes={['tickets']}
  onSearch={(filters) => {
    const urgentTickets = tickets.filter(ticket => 
      ticket.priority === 'high' && 
      ticket.status === 'open' &&
      ticket.title.toLowerCase().includes(filters.searchTerm.toLowerCase())
    );
  }}
/>
```

### Ödeme Arama
```tsx
// Belirli tarih aralığındaki ödemeleri bul
<AdvancedSearch
  searchTypes={['payments']}
  onSearch={(filters) => {
    const dateFilteredPayments = payments.filter(payment => 
      new Date(payment.createdAt) >= new Date(filters.dateRange.start) &&
      new Date(payment.createdAt) <= new Date(filters.dateRange.end) &&
      payment.amount >= filters.amountRange.min
    );
  }}
/>
```

## 🚀 Performans Optimizasyonu

### Debouncing
```tsx
import { useDebounce } from 'use-debounce';

const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

useEffect(() => {
  // Arama işlemi sadece 300ms sonra çalışır
  performSearch(debouncedSearchTerm);
}, [debouncedSearchTerm]);
```

### Memoization
```tsx
import { useMemo } from 'react';

const filteredData = useMemo(() => {
  return data.filter(item => {
    // Filtreleme mantığı
  });
}, [data, filters]);
```

## 🐛 Sorun Giderme

### Yaygın Sorunlar

1. **Filtreler Çalışmıyor**
   - `onSearch` callback'inin doğru tanımlandığından emin olun
   - State güncellemelerinin doğru yapıldığını kontrol edin

2. **Tarih Filtreleri Çalışmıyor**
   - Tarih formatının `YYYY-MM-DD` olduğundan emin olun
   - `createdAt` alanının doğru formatta olduğunu kontrol edin

3. **Etiketler Eklenmiyor**
   - `onKeyPress` event'inin doğru çalıştığını kontrol edin
   - Boş etiket eklenmesini engelleyin

### Debug İpuçları
```tsx
// Filtreleri konsola yazdır
console.log('Current filters:', advancedFilters);

// Filtrelenmiş veriyi kontrol et
console.log('Filtered data:', filteredData);

// Performans ölçümü
console.time('filtering');
const result = performFiltering(data, filters);
console.timeEnd('filtering');
```

## 📈 Gelecek Geliştirmeler

### Planlanan Özellikler
- [ ] **Kayıtlı Filtreler**: Sık kullanılan filtreleri kaydetme
- [ ] **Filtre Geçmişi**: Son kullanılan filtreleri hatırlama
- [ ] **Gelişmiş Operatörler**: AND, OR, NOT operatörleri
- [ ] **Fuzzy Search**: Yazım hatalarını tolere eden arama
- [ ] **Otomatik Tamamlama**: Akıllı öneriler sistemi

### API Entegrasyonu
- [ ] **Backend Filtreleme**: Sunucu tarafında filtreleme
- [ ] **Pagination**: Sayfalama desteği
- [ ] **Real-time Updates**: Gerçek zamanlı güncellemeler

## 📞 Destek

Herhangi bir sorun yaşarsanız veya önerileriniz varsa:

1. **GitHub Issues**: Proje repository'sinde issue açın
2. **Dokümantasyon**: Bu README dosyasını güncelleyin
3. **Code Review**: Pull request ile katkıda bulunun

---

**Not**: Bu gelişmiş arama sistemi, modern web standartlarına uygun olarak geliştirilmiştir ve sürekli olarak iyileştirilmektedir.
